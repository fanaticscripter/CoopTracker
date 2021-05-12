import dayjs, { Dayjs } from 'dayjs';

import { requestQueryCoop } from './api';
import { ContractLeague, ContractCompletionStatus, getContractFromPlayerSave } from './contract';
import { SortedContractList } from './contractList';
import { ei } from './proto';
import { FarmerRole, soulPowerToFarmerRole } from './role';

const COOP_LEAGUE_DIVIDER_EB = 1e13; // 10T%
const COOP_LEAGUE_DEFINITELY_STANDARD_EB = 1e12;
const COOP_LEAGUE_DEFINITELY_ELITE_EB = 1e16;

export class CoopStatus {
  contractId: string;
  contract: ei.IContract | null;
  coopCode: string;
  isPublic: boolean;
  eggsLaid: number;
  eggsPerHour: number;
  secondsRemaining: number;
  projectedEggsLaid: number;
  totalEarningsBoost: number;
  totalEggLayingRateBoost: number;
  contributors: Contributor[];
  creator: Contributor | null;
  league: ContractLeague | null;
  leagueStatus: CoopLeagueStatus | null;
  refreshTime: Dayjs;
  expirationTime: Dayjs;

  constructor(cs: ei.IContractCoopStatusResponse) {
    this.contractId = cs.contractIdentifier!;
    this.contract = null;
    this.coopCode = cs.coopIdentifier!;
    this.isPublic = cs.public!;
    this.eggsLaid = cs.totalAmount!;
    this.contributors = (cs.contributors || []).map(c => new Contributor(c));
    this.eggsPerHour = this.contributors.reduce((sum, c) => sum + c.eggsPerHour, 0);
    this.secondsRemaining = cs.secondsRemaining!;
    this.projectedEggsLaid =
      this.eggsLaid + (this.eggsPerHour * Math.max(this.secondsRemaining, 0)) / 3600;
    this.totalEarningsBoost = this.contributors.reduce((sum, c) => sum + c.earningsBoost, 0);
    this.totalEggLayingRateBoost = this.contributors.reduce(
      (sum, c) => sum + c.eggLayingRateBoost,
      0
    );
    this.creator = null;
    for (const contributor of this.contributors) {
      if (contributor.id === cs.creatorId) {
        this.creator = contributor;
      }
    }
    this.league = null;
    this.leagueStatus = null;
    this.refreshTime = dayjs(cs.localTimestamp! * 1000);
    this.expirationTime = this.refreshTime.add(cs.secondsRemaining!, 'second');
  }

  async resolveContract({
    store,
    addToStore,
    knownContract,
  }: {
    store: SortedContractList;
    addToStore?: (contract: ei.IContract) => void;
    knownContract?: ei.IContract;
  }) {
    const contract = knownContract || store.get(this.contractId, this.expirationTime.unix());
    if (contract) {
      this.contract = contract;
      await this.resolveLeague();
    } else {
      if (this.contributors.length === 0) {
        throw new Error(
          `No contributors found in ${this.contractId}:${this.coopCode}, cannot resolve contract info.`
        );
      }
      const userId = this.contributors[0].id;
      const result = await getContractFromPlayerSave(userId, this.contractId);
      if (!result) {
        throw new Error(`Contract ${this.contractId} not found in user ${userId}'s save.`);
      }
      this.contract = result.contract;
      this.league = result.league;
      if (addToStore) {
        addToStore(result.contract);
      }
    }
    const goals = this.contract.goalSets
      ? this.contract.goalSets[this.league as number].goals!
      : this.contract.goals!;
    this.leagueStatus = new CoopLeagueStatus(
      this.eggsLaid,
      this.eggsPerHour,
      this.secondsRemaining,
      goals
    );
  }

  async resolveLeague(): Promise<ContractLeague> {
    if (this.contributors.length === 0) {
      // Ghost coop, don't care.
      this.league = ContractLeague.Elite;
      return this.league;
    }

    // Heuristics.
    let belowThresholdCount = 0;
    let aboveThresholdCount = 0;
    for (const contributor of this.contributors.reverse()) {
      const eb = contributor.earningBonusPercentage;
      if (eb < COOP_LEAGUE_DEFINITELY_STANDARD_EB) {
        this.league = ContractLeague.Standard;
        return this.league;
      }
      if (eb > COOP_LEAGUE_DEFINITELY_ELITE_EB) {
        this.league = ContractLeague.Elite;
        return this.league;
      }
      if (eb < COOP_LEAGUE_DIVIDER_EB) {
        belowThresholdCount++;
      } else {
        aboveThresholdCount++;
      }
    }
    const heuristicLeague =
      aboveThresholdCount > belowThresholdCount ? ContractLeague.Elite : ContractLeague.Standard;

    try {
      // Query /ei/query_coop to see if elite league is the wrong league.
      const queryCoopResponse = await requestQueryCoop(this.contractId, this.coopCode, 0);
      this.league = queryCoopResponse.differentLeague
        ? ContractLeague.Standard
        : ContractLeague.Elite;
      return this.league;
    } catch (e) {
      console.error(`failed to query coop ${this.contractId}:${this.coopCode}: ${e}`);
      this.league = heuristicLeague;
      return this.league;
    }
  }
}

export class CoopLeagueStatus {
  eggsLaid: number;
  eggsPerHour: number;
  completionStatus: ContractCompletionStatus;
  goals: ei.Contract.IGoal[];
  finalTarget: number;
  expectedTimeToComplete: number;
  requiredEggsPerHour: number;

  constructor(
    eggsLaid: number,
    eggsPerHour: number,
    secondsRemaining: number,
    goals: ei.Contract.IGoal[]
  ) {
    this.eggsLaid = eggsLaid;
    this.eggsPerHour = eggsPerHour;
    this.goals = goals;
    this.finalTarget = goals[goals.length - 1].targetAmount!;
    if (eggsLaid >= this.finalTarget) {
      this.completionStatus = ContractCompletionStatus.HasCompleted;
      this.expectedTimeToComplete = 0;
      this.requiredEggsPerHour = 0;
      return;
    }
    this.expectedTimeToComplete = ((this.finalTarget - eggsLaid) / eggsPerHour) * 3600;
    if (secondsRemaining <= 0) {
      this.completionStatus = ContractCompletionStatus.HasNoTimeLeft;
      this.requiredEggsPerHour = 0;
      return;
    }
    this.requiredEggsPerHour = ((this.finalTarget - eggsLaid) / secondsRemaining) * 3600;
    this.completionStatus =
      eggsPerHour >= this.requiredEggsPerHour
        ? ContractCompletionStatus.IsOnTrackToFinish
        : ContractCompletionStatus.IsNotOnTrackToFinish;
  }

  expectedTimeToCompleteGoal(goal: ei.Contract.IGoal): number {
    const target = goal.targetAmount!;
    if (this.eggsLaid >= target) {
      return 0;
    }
    return ((target - this.eggsLaid) / this.eggsPerHour) * 3600;
  }
}

export class Contributor {
  id: string;
  name: string;
  eggsLaid: number;
  eggsPerHour: number;
  earningBonusPercentage: number;
  farmerRole: FarmerRole;
  tokens: number;
  isActive: boolean;
  isTimeCheating: boolean;
  isLeeching: boolean; // New in v1.20.8
  earningsBoost: number;
  eggLayingRateBoost: number;
  // New in v1.20.8, not available for coops before that or (maybe) contributors
  // on lower app versions.
  tokensSpent: number | null;
  hourlyLayingRateUncapped: number | null;
  hourlyShippingCapacity: number | null;
  farmPopulation: number | null;
  farmCapacity: number | null;
  internalHatcheryRatePerMinPerHab: number | null;

  constructor(contributor: ei.ContractCoopStatusResponse.IContributionInfo) {
    this.id = contributor.userId!;
    this.name = contributor.userName!;
    this.eggsLaid = contributor.contributionAmount!;
    this.eggsPerHour = contributor.contributionRate! * 3600;
    this.earningBonusPercentage = Math.pow(10, contributor.soulPower!) * 100;
    this.farmerRole = soulPowerToFarmerRole(contributor.soulPower!);
    this.tokens = contributor.boostTokens!;
    this.isActive = contributor.active!;
    this.isTimeCheating = contributor.timeCheatDetected!;
    this.isLeeching = contributor.leech!;
    this.earningsBoost = 0;
    this.eggLayingRateBoost = 0;
    if (Array.isArray(contributor.buffHistory) && contributor.buffHistory.length > 0) {
      const currentBuff = contributor.buffHistory[contributor.buffHistory.length - 1];
      this.earningsBoost = currentBuff.earnings! - 1;
      this.eggLayingRateBoost = currentBuff.eggLayingRate! - 1;
    }

    this.tokensSpent = isValue(contributor.boostTokensSpent) ? contributor.boostTokensSpent : null;
    this.hourlyLayingRateUncapped = null;
    this.hourlyShippingCapacity = null;
    this.farmPopulation = null;
    this.farmCapacity = null;
    this.internalHatcheryRatePerMinPerHab = null;
    const params = contributor.productionParams;
    if (params) {
      if (isValue(params.elr) && isValue(params.farmPopulation)) {
        this.hourlyLayingRateUncapped = params.elr * params.farmPopulation * 3600;
      }
      if (isValue(params.sr)) {
        this.hourlyShippingCapacity = params.sr * 3600;
      }
      if (isValue(params.farmPopulation)) {
        this.farmPopulation = params.farmPopulation;
      }
      if (isValue(params.farmCapacity)) {
        this.farmCapacity = params.farmCapacity;
      }
      if (isValue(params.ihr)) {
        this.internalHatcheryRatePerMinPerHab = params.ihr * 60;
      }
    }
  }
}

function isValue<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}
