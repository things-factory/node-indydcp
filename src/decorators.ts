import capitalize from 'lodash/capitalize'
import { IIndyDCPClient } from './const'
import { DTYPES, DTRANSFORM } from './packet'

export const socket_connect = (target: Object, property: string, descriptor: TypedPropertyDescriptor<any>): any => {
  const method = descriptor.value

  descriptor.value = async function (...args) {
    await this.lock.acquireAsync()
    // this.connect()
    var retval = method.apply(this, args)
    // this.disconnect()
    this.lock.release()

    return retval
  }

  return descriptor
}

export const tcp_command = command => (
  target: Object,
  property: string,
  descriptor: TypedPropertyDescriptor<any>
): any => {
  const method = descriptor.value

  descriptor.value = function (...args) {
    this.handleCommand(command)
    return method.apply(this, args)
  }

  return descriptor
}

export const tcp_command_rec = (command, dataType) => (
  target: Object,
  property: string,
  descriptor: TypedPropertyDescriptor<any>
): any => {
  const method = descriptor.value

  descriptor.value = function (...args) {
    var { errorCode, resData, resDataSize } = this.handleCommand(command)
    if (errorCode) {
      return errorCode
    }

    var retval = method.apply(this, args)
    if (retval) {
      // return np.array(eval('_resData.' + retval)).tolist()
    } else {
      // return np.array(eval('_resData.' + dataType)).tolist()
    }
  }

  return descriptor
}

/*
 * 패킷을 구성하기 위한 커맨드와 데이타에 포함될 데이타의 형식을 지정한다.
 * 특성상, 단일 데이타 형식만으로 데이타 패킷이 구성되는 경우에 사용한다.
 * decorated 함수로 전달된 값이 데이타 패킷에 들어가게 된다.
 * decorated 함수는 실제로 아무런 구현이 없다.
 * TODO around intercept 방식과 다중 decorator를 사용해서, 많은 종류의 데코레이터가 필요하지 않도록 구조를 잡자.
 */
export const tcp_command_req = (command, dataType, size?) => (
  target: Object,
  property: string,
  descriptor: TypedPropertyDescriptor<any>
): any => {
  const method = descriptor.value

  descriptor.value = function (...args) {
    var data = args[0]
    var datumSize = DTYPES[dataType] || 0
    var bufferWriteMethod = `write${DTRANSFORM[dataType]}`

    if (data instanceof Array) {
      var reqData = Buffer.alloc(datumSize * data.length)

      for (let i = 0; i < data.length; i++) {
        reqData[bufferWriteMethod](data[i], datumSize * i)
      }
    } else {
      var reqData = Buffer.alloc(datumSize)
      reqData[bufferWriteMethod](data, 0)
    }

    this.handleCommand(command, reqData)

    return method.apply(this, args)
  }

  return descriptor
}

/*
 * 요청 패킷을 구성하기 위한 커맨드와 데이타에 포함될 데이타의 형식을 지정하고, 응답 패킷으로부터 받게될 응답데이타 형식을 지정한다.
 * 특성상, 단일 데이타 형식만으로 데이타 패킷을 주고 받는 경우에 사용한다.
 * decorated 함수로 전달된 값이 데이타 패킷에 들어가게 되고, decorated의 리턴값이 응답데이타 형식을 오버라이드할 수도 있다.
 * decorated 함수는 실제로 아무런 구현이 없다.
 * TODO tcp_command_req 데코레이터와 통합할 수 있다.
 */
export const tcp_command_req_rec = (command, dataType, dataSize, dataTypeRec?) => (
  target: Object,
  property: string,
  descriptor: TypedPropertyDescriptor<any>
): any => {
  const method = descriptor.value

  descriptor.value = function (...args) {
    var data = args[0]
    var datumSize = DTYPES[dataType] || 0
    var bufferWriteMethod = `write${DTRANSFORM[dataType]}`

    if (data instanceof Array) {
      var reqData = Buffer.alloc(datumSize * data.length)

      for (let i = 0; i < data.length; i++) {
        reqData[bufferWriteMethod](data[i], datumSize * i)
      }
    } else {
      var reqData = Buffer.alloc(datumSize)
      reqData[bufferWriteMethod](data, 0)
    }

    var { errorCode, resData, resDataSize } = this.handleCommand(command, reqData)
    if (errorCode) {
      return errorCode
    }

    dataTypeRec = method.apply(this, args) || dataTypeRec

    var recDatumSize = DTYPES[dataTypeRec] || 0
    var bufferReadMethod = `read${DTRANSFORM[dataTypeRec]}`
    var retval = []

    for (let i = 0; i < Math.floor(resDataSize / recDatumSize); i++) {
      retval.push(resData[bufferReadMethod](i * recDatumSize))
    }

    return retval
  }

  return descriptor
}
