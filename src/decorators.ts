import 'reflect-metadata'
import { IIndyDCPClient } from './const'

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

export const tcp_command = cmd => (target: Object, property: string, descriptor: TypedPropertyDescriptor<any>): any => {
  const method = descriptor.value

  descriptor.value = function (...args) {
    this.handle_command(cmd)
    return method.apply(this, args)
  }

  return descriptor
}

export const tcp_command_rec = (cmd, data_type) => (
  target: Object,
  property: string,
  descriptor: TypedPropertyDescriptor<any>
): any => {
  const method = descriptor.value

  descriptor.value = function (...args) {
    var { error_code, res_data, res_data_size } = this.handle_command(cmd)
    if (error_code) {
      return error_code
    }

    var retval = method.apply(this, args)
    if (retval) {
      // return np.array(eval('_res_data.' + retval)).tolist()
    } else {
      // return np.array(eval('_res_data.' + data_type)).tolist()
    }
  }

  return descriptor
}

export const tcp_command_req = (cmd, data_type, data_size) => (
  target: Object,
  property: string,
  descriptor: TypedPropertyDescriptor<any>
): any => {
  const method = descriptor.value

  descriptor.value = function (...args) {
    var req_data = null // TODO implement
    var req_data_size = data_size
    var arg0 = args[0]
    var tmp_val

    if (arg0 instanceof Array) {
      for (let i in arg0) {
        tmp_val = arg0[i]
        // exec('_req_data.' + data_type + '[j] = tmp_val')
      }
    } else {
      tmp_val = arg0
      // exec('_req_data.' + data_type + ' = tmp_val')
    }

    this.handle_command(cmd, req_data, req_data_size)
    return method.apply(this, args)
  }

  return descriptor
}

export const tcp_command_req_rec = (cmd, data_type_req, data_size, data_type_rec) => (
  target: Object,
  property: string,
  descriptor: TypedPropertyDescriptor<any>
): any => {
  const method = descriptor.value

  descriptor.value = function (...args) {
    var req_data = null // TODO implement
    var req_data_size = data_size
    var args0 = args[0]
    var tmp_val

    if (args0 instanceof Array) {
      for (let i in args0) {
        tmp_val = args0[i]
        // exec('req_data.' + data_type_req + '[j] = tmp_val')
      }
    } else {
      tmp_val = args0
      // exec('req_data.' + data_type_req + ' = tmp_val')
    }

    var { error_code, res_data, res_data_size } = this.handle_command(cmd, req_data, req_data_size)
    if (error_code) {
      return error_code
    }

    var retval = method.apply(this, args)
    if (retval) {
      // return np.array(eval('_res_data.' + retval)).tolist()
    } else {
      // return np.array(eval('_res_data.' + data_type_rec)).tolist()
    }
  }

  return descriptor
}
