import type { CodexExperimentalMethod, CodexStableMethod } from "./method-params";
import type { InitializeResponse } from "./generated/stable";
import type {
  CancelLoginAccountResponse,
  GetAccountRateLimitsResponse,
  GetAccountResponse,
  HooksListResponse,
  LoginAccountResponse,
  LogoutAccountResponse,
  ModelListResponse,
  SkillsConfigWriteResponse,
  SkillsListResponse,
  AppsListResponse,
  ThreadArchiveResponse,
  ThreadCompactStartResponse,
  ThreadForkResponse,
  ThreadInjectItemsResponse,
  ThreadListResponse,
  ThreadLoadedListResponse,
  ThreadMetadataUpdateResponse,
  ThreadReadResponse,
  ThreadResumeResponse,
  ThreadRollbackResponse,
  ThreadSetNameResponse,
  ThreadStartResponse,
  ThreadUnarchiveResponse,
  ThreadUnsubscribeResponse,
  TurnInterruptResponse,
  TurnStartResponse,
  TurnSteerResponse,
} from "./generated/stable/v2";
import type {
  CollaborationModeListResponse,
  EnvironmentAddResponse,
  MemoryResetResponse,
  ProcessKillResponse,
  ProcessResizePtyResponse,
  ProcessSpawnResponse,
  ProcessWriteStdinResponse,
  RemoteControlDisableResponse,
  RemoteControlEnableResponse,
  RemoteControlStatusReadResponse,
  ThreadBackgroundTerminalsCleanResponse,
  ThreadDecrementElicitationResponse,
  ThreadIncrementElicitationResponse,
  ThreadMemoryModeSetResponse,
  ThreadRealtimeAppendAudioResponse,
  ThreadRealtimeAppendTextResponse,
  ThreadRealtimeListVoicesResponse,
  ThreadRealtimeStartResponse,
  ThreadRealtimeStopResponse,
  ThreadSearchResponse,
  ThreadSettingsUpdateResponse,
  ThreadTurnsListResponse,
} from "./generated/experimental/v2";
import type {
  FuzzyFileSearchSessionStartResponse,
  FuzzyFileSearchSessionStopResponse,
  FuzzyFileSearchSessionUpdateResponse,
} from "./generated/experimental";
import type {
  ExperimentalAvailableMethod,
  StableProductizedMethod,
} from "./protocol";

interface StableMethodResultMap {
  "account/login/cancel": CancelLoginAccountResponse;
  "account/login/start": LoginAccountResponse;
  "account/logout": LogoutAccountResponse;
  "account/rateLimits/read": GetAccountRateLimitsResponse;
  "account/read": GetAccountResponse;
  "app/list": AppsListResponse;
  "hooks/list": HooksListResponse;
  "initialize": InitializeResponse;
  "model/list": ModelListResponse;
  "skills/config/write": SkillsConfigWriteResponse;
  "skills/list": SkillsListResponse;
  "thread/archive": ThreadArchiveResponse;
  "thread/compact/start": ThreadCompactStartResponse;
  "thread/fork": ThreadForkResponse;
  "thread/inject_items": ThreadInjectItemsResponse;
  "thread/list": ThreadListResponse;
  "thread/loaded/list": ThreadLoadedListResponse;
  "thread/metadata/update": ThreadMetadataUpdateResponse;
  "thread/name/set": ThreadSetNameResponse;
  "thread/read": ThreadReadResponse;
  "thread/resume": ThreadResumeResponse;
  "thread/rollback": ThreadRollbackResponse;
  "thread/start": ThreadStartResponse;
  "thread/unarchive": ThreadUnarchiveResponse;
  "thread/unsubscribe": ThreadUnsubscribeResponse;
  "turn/interrupt": TurnInterruptResponse;
  "turn/start": TurnStartResponse;
  "turn/steer": TurnSteerResponse;
}

interface ExperimentalMethodResultMap {
  "collaborationMode/list": CollaborationModeListResponse;
  "environment/add": EnvironmentAddResponse;
  "fuzzyFileSearch/sessionStart": FuzzyFileSearchSessionStartResponse;
  "fuzzyFileSearch/sessionStop": FuzzyFileSearchSessionStopResponse;
  "fuzzyFileSearch/sessionUpdate": FuzzyFileSearchSessionUpdateResponse;
  "memory/reset": MemoryResetResponse;
  "process/kill": ProcessKillResponse;
  "process/resizePty": ProcessResizePtyResponse;
  "process/spawn": ProcessSpawnResponse;
  "process/writeStdin": ProcessWriteStdinResponse;
  "remoteControl/disable": RemoteControlDisableResponse;
  "remoteControl/enable": RemoteControlEnableResponse;
  "remoteControl/status/read": RemoteControlStatusReadResponse;
  "thread/backgroundTerminals/clean": ThreadBackgroundTerminalsCleanResponse;
  "thread/decrement_elicitation": ThreadDecrementElicitationResponse;
  "thread/increment_elicitation": ThreadIncrementElicitationResponse;
  "thread/memoryMode/set": ThreadMemoryModeSetResponse;
  "thread/realtime/appendAudio": ThreadRealtimeAppendAudioResponse;
  "thread/realtime/appendText": ThreadRealtimeAppendTextResponse;
  "thread/realtime/listVoices": ThreadRealtimeListVoicesResponse;
  "thread/realtime/start": ThreadRealtimeStartResponse;
  "thread/realtime/stop": ThreadRealtimeStopResponse;
  "thread/search": ThreadSearchResponse;
  "thread/settings/update": ThreadSettingsUpdateResponse;
  "thread/turns/list": ThreadTurnsListResponse;
}

type AssertNever<T extends never> = T;
type StableMethodResultMapCoverage = AssertNever<
  | Exclude<StableProductizedMethod, keyof StableMethodResultMap>
  | Exclude<keyof StableMethodResultMap, StableProductizedMethod>
>;
type ExperimentalMethodResultMapCoverage = AssertNever<
  | Exclude<ExperimentalAvailableMethod, keyof ExperimentalMethodResultMap>
  | Exclude<keyof ExperimentalMethodResultMap, ExperimentalAvailableMethod>
>;

export type CodexStableMethodResult<TMethod extends CodexStableMethod> =
  [StableMethodResultMapCoverage] extends [never]
    ? TMethod extends keyof StableMethodResultMap
      ? StableMethodResultMap[TMethod]
      : unknown
    : never;

export type CodexExperimentalMethodResult<TMethod extends CodexExperimentalMethod> =
  [ExperimentalMethodResultMapCoverage] extends [never]
    ? TMethod extends keyof ExperimentalMethodResultMap
      ? ExperimentalMethodResultMap[TMethod]
      : unknown
    : never;
