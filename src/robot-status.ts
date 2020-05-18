import { bin } from './utils'

enum StatusFlag {
  isRobotRunning = 0,
  isRobotReady = 1,
  is_emergencyStop = 2,
  isCollided = 3,
  is_errorState = 4,
  isBusy = 5,
  isMoveFinished = 6,
  isHome = 7,
  isZero = 8,
  isInResetting = 9,
  isDirectTeachingMode = 24,
  isTeachingMode = 25,
  isProgramRunning = 26,
  isProgramPaused = 27,
  isContyConnected = 28
}

export class RobotStatus {
  static from(wordStatus: Number) {
    var status_str = bin(wordStatus)
    var robotStatus = new RobotStatus()

    for (let prop in StatusFlag) {
      robotStatus[prop] = status_str[StatusFlag[prop]] == '1'
    }

    return robotStatus
  }

  public isRobotRunning: boolean
  public isRobotReady: boolean
  public is_emergencyStop: boolean
  public isCollided: boolean
  public is_errorState: boolean
  public isBusy: boolean
  public isMoveFinished: boolean
  public isHome: boolean
  public isZero: boolean
  public isInResetting: boolean
  public isDirectTeachingMode: boolean
  public isTeachingMode: boolean
  public isProgramRunning: boolean
  public isProgramPaused: boolean
  public isContyConnected: boolean
}
