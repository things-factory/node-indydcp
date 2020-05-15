import { DTYPES, DTRANSFORM } from './packet'

export const mutex = (target: Object, property: string, descriptor: TypedPropertyDescriptor<any>): any => {
  const method = descriptor.value

  descriptor.value = async function (...args) {
    await this.lock.acquireAsync()
    var retval = await method.apply(this, args)
    this.lock.release()

    return retval
  }

  return descriptor
}

/*
 * 요청 패킷을 구성하기 위한 커맨드와 데이타에 포함될 데이타의 형식을 지정하고, 응답 패킷으로부터 받게될 응답데이타 형식을 지정한다.
 * (IndyDCP 프로토콜은 단일 데이타(또는 배열) 형식만으로 데이타 패킷을 주고 받는 것으로 이해된다.)
 * decorated 함수로 전달된 값이 데이타 패킷에 들어가게 된다. 만약, resDataType이 정의되지 않으면, 요청 패킷에 데이타도 채워지지않는다.
 * decorated 함수의 기능을 고민할 필요가 있다.
 */
export const packet = (command, reqDataType?, resDataType?) => (
  target: Object,
  property: string,
  descriptor: TypedPropertyDescriptor<any>
): any => {
  const method = descriptor.value

  descriptor.value = async function (...args) {
    var reqData

    if (!reqDataType) {
    } else {
      var data = args[0]

      var { serializer } = DTRANSFORM[reqDataType]
      reqData = serializer(data)
    }

    var { errorCode, resData, resDataSize } = await this.handleCommand(command, reqData)
    if (errorCode) {
      return errorCode
    }

    if (resDataType) {
      var { deserializer } = DTRANSFORM[resDataType]
      return deserializer(resData)
    }
  }

  return descriptor
}
