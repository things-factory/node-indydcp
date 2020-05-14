/* Error code */
export enum ErrorCode {
  ERR_NONE = 0,
  ERR_NO_MATCHED_ROBOT = 1,
  ERR_NO_MATCHED_STEP = 2,
  ERR_HEADER_FORMAT = 4,
  ERR_OVER_DATA_SIZE = 5,
  ERR_NOT_SUPPORT_COMMAND = 6,
  ERR_UNKNOWN_COMMAND = 7,
  ERR_UNKNOWN_DATA = 8,
  ERR_PROCESS_FAILED = 9,
  ERR_PARSE_FAILED = 10,
  ERR_NO_MATCHED_PARAMETER = 11,
  ERR_NO_MATCHED_DATA_SIZE = 12,
  ERR_WRONG_ASCII_FORMAT = 13,
  ERR_ROBOT_MOVING_STATE = 14,
  ERR_ROBOT_PROGRAM_RUNNING = 15,
  ERR_ROBOT_MOVE_FAILED = 16,
  ERR_NO_DEFAULT_PROGRAM = 17,
  ERR_NO_CURRENT_PROGRAM = 18,
  ERR_CURRENT_PROGRAM_STATE = 19,
  ERR_EMG_STATE = 20,
  ERR_ROBOT_STATE = 21,
  ERR_ROBOT_PROGRAM_LOAD_FAILED = 22,
  ERR_DIRECT_VARIABLE_INVALID_ADDRESS = 23,
  ERR_DIRECT_VARIABLE_INVALID_FORMAT = 24,
  ERR_DIRECT_VARIABLE_REFNUM_LIMIT = 25,
  ERR_CONNECTION_EXCEPTION = 600,
  ERR_CONNECTION_TIMEOUT = 601
}

/* Error String */
export const ERROR_STRING = {
  [ErrorCode.ERR_NONE]: 'No Error',
  [ErrorCode.ERR_NO_MATCHED_ROBOT]: 'Not matched robot',
  [ErrorCode.ERR_NO_MATCHED_STEP]: 'Not matched step',
  [ErrorCode.ERR_HEADER_FORMAT]: 'Invalid header format',
  [ErrorCode.ERR_OVER_DATA_SIZE]: 'Over data size',
  [ErrorCode.ERR_NOT_SUPPORT_COMMAND]: 'Unsupported command',
  [ErrorCode.ERR_UNKNOWN_COMMAND]: 'Unknown command',
  [ErrorCode.ERR_UNKNOWN_DATA]: 'Unknown data',
  [ErrorCode.ERR_PROCESS_FAILED]: 'Process fail',
  [ErrorCode.ERR_PARSE_FAILED]: 'Parsing fail (data error)',
  [ErrorCode.ERR_NO_MATCHED_PARAMETER]: 'Not matched data type',
  [ErrorCode.ERR_NO_MATCHED_DATA_SIZE]: 'Not matched data size ',
  // [ErrorCode.ERR_WRONG_ASCII_FORMAT]: "",
  [ErrorCode.ERR_ROBOT_MOVING_STATE]: 'Robot is moving',
  [ErrorCode.ERR_ROBOT_PROGRAM_RUNNING]: 'Robot program is running',
  [ErrorCode.ERR_ROBOT_MOVE_FAILED]: 'Move fail',
  [ErrorCode.ERR_NO_DEFAULT_PROGRAM]: 'No default program',
  [ErrorCode.ERR_NO_CURRENT_PROGRAM]: 'No loaded program',
  [ErrorCode.ERR_CURRENT_PROGRAM_STATE]: 'No proper program state',
  [ErrorCode.ERR_EMG_STATE]: 'Robot is emergency state',
  [ErrorCode.ERR_ROBOT_STATE]: 'Not proper robot state',
  [ErrorCode.ERR_ROBOT_PROGRAM_LOAD_FAILED]: 'Program load fail',
  [ErrorCode.ERR_DIRECT_VARIABLE_INVALID_ADDRESS]: 'Invalid direct variable address',
  [ErrorCode.ERR_DIRECT_VARIABLE_INVALID_FORMAT]: 'Invalid direct variable format',
  [ErrorCode.ERR_DIRECT_VARIABLE_REFNUM_LIMIT]: 'Limit of direct variable size'
}

export function getErrorString(errorCode) {
  return ERROR_STRING[errorCode] || 'None'
}
