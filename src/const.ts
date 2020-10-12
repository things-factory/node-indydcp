/* Robot Type */
export const ROBOT_INDY7 = 'NRMK-Indy7'
export const ROBOT_INDYRP2 = 'NRMK-IndyRP2'
export const ROBOT_INDY12 = 'NRMK-Indy12'

/* DirectVariableType */
export enum DirectVariableType {
  ERROR = -1,
  BYTE = 0,
  WORD = 1,
  DWORD = 2,
  LWORD = 3,
  FLOAT = 4,
  DFLOAT = 5,
  MODBUS_REG = 10
}

/* End Tool Type */
export enum EndToolType {
  NPN,
  PNP,
  NoUse,
  eModi
}

/* Task Base Mode */
export enum TaskBaseMode {
  REFERENCE_BODY,
  END_EFFECT_TOOL_TIP
}

/* Indy Client Interface */
export interface IIndyDCPClient {
  JOINT_DOF
  lock
  socket
  invokeId
  serverIp
  robotName
  robotVersion
  robotStatus
  stepInfo
  sofClient

  connect()
  disconnect()
  shutdown()
  getRobotStatus()
  handleCommand(command, reqData, reqDataSize): Promise<{ errorCode; resData; resDataSize }>
  handleExtendedCommand(extCommand, reqExtData, reqExtDataSize): Promise<{ errorCode; resData; resDataSize }>
  /* Robot command function (Check all) */
  check()
  emergencyStop()
  resetRobot()
  setServo(arr)
  setBrake(arr)
  stopMotion()
  executeMove(command_name)
  // Move commands
  goHome()
  goZero()
  jointMoveTo(q)
  jointMoveBy(q)
  taskMoveTo(p)
  taskMoveBy(p)
  // Program control
  startCurrentProgram()
  pauseCurrentProgram()
  resumeCurrentProgram()
  stopCurrentProgram()
  startDefaultProgram()
  setDefaultProgram(idx)
  getDefaultProgramIdx()
  // Get robot status
  isRobotRunning()
  isRobotReady()
  isEmergencyStop()
  isCollided()
  isErrorState()
  isBusy()
  isMoveFinished()
  isHome()
  isZero()
  isInResetting()
  isDirectTeachingMode()
  isTeachingMode()
  isProgramRunning()
  isProgramPaused()
  isContyConnected()
  // Direct teaching

  changeToDirectTeaching()
  finishDirectTeaching()
  pushBackJointWaypoint(q)
  popBackJointWaypoint()
  clearJointWaypoints()
  executeJointWaypoints()
  pushBackTaskWaypoint(p)
  popBackTaskWaypoint()
  clearTaskWaypoints()
  executeTaskWaypoints()
  // Get/Set some global robot variables

  setDefaultTcp(tcp)
  resetDefaultTcp()
  setTcpCompensation(tcp)
  resetTcpCompensation()
  setRefFrame(ref)
  resetRefFrame()
  setCollisionLevel(level)
  setJointSpeedLevel(level)
  setTaskSpeedLevel(level)
  setJointWaypointTime(time)
  setTaskWaypointTime(time)
  setTaskBaseMode(mode)
  setJointBlendRadius(radius)
  setTaskBlendRadius(radius)
  getDefaultTcp()
  getTcpCompensation()
  getRefFrame()
  getCollisionLevel()
  getJointSpeedLevel()
  getTaskSpeedLevel()
  getJointWaypointTime()
  getTaskWaypointTime()
  getTaskBaseMode()
  getJointBlendRadius()
  getTaskBlendRadius()
  getRobotRunningTime()
  getCmode()
  getServoState()
  getJointPos()
  getJointVel()
  getTaskPos()
  getTaskVel()
  getTorque()
  getLastEmergencyInfo()
  // I/O

  getSmartDI(idx)
  getSmartDIs()
  setSmartDO(idx, val)
  setSmartDOs(idx)
  getSmartAI(idx)
  setSmartAO(idx, val)
  getSmartDO(idx)
  getSmartDOs()
  getSmartAO(idx)
  setEndtoolDO(endtool_type, val)
  getEndtoolDO(type)
  // FT sensor implementation

  getRobotFtSensorRaw()
  getRobotFtSensorProcess()
  getCbFtSensorRaw()
  getCbFtSensorProcess()
  readDirectVariable(dvType, dvAddr)
  readDirectVariables(dvType, dvAddr, dvLen)
  writeDirectVariable(dvType, dvAddr, val)
  writeDirectVariables(dvType, dvAddr, dvLen, val)
  // Not released

  setReducedMode(mode)
  setReducedSpeedRatio(ratio)
  getReducedMode()
  getReducedSpeedRatio()
  /* Extended IndyDCP command (Check all) */

  moveExtTrajBin(trajType, trajFreq, datSize, trajData, datNum)
  moveExtTrajTxt(trajType, trajFreq, datSize, trajData, datNum)
  moveExtTrajBinFile(filename)
  moveExtTrajTxtFile(filename)
  jointMoveToWpSet()
  taskMoveToWpSet()
  /* JSON programming added (only for internal engineer) */
  setJsonProgram()
  setAndStartJsonProgram(jsonString)
  waitForProgramFinish()
  setWorkspace(commandPos)
  /* Teaching points */
  loadTeachingData(filename)
  updateTeachingData(filename, wpName, jPos)
  delTeachingData(filename, wpName)
}
