
import { getKeyByVersion, REF_REPLACE_PRFIX } from "./define";
import { Serializer } from "./serializer";

export const PROPERTIES_BASE_TYPE_DICT = {
  number: 'number',
  integer: 'number',
  float: 'number',
  double: 'number',
  string: 'string',
  boolean: 'boolean',
}

export class DataType {
  static commentCode: string;
  // 定义各个数据类型
  static generateDataType(name: string, properties: any, required = false): string {

    if (!properties) return '';

    DataType.commentCode = `${genComment(properties.description)}`
    // 寻找当前属性的引用
    if (properties.allOf) {
      properties.$ref = properties.allOf[0].$ref;
    }

    // 处理当前属性的值 是其他的类型，例如 xxInterface
    if (properties.$ref) {
      return DataType.generateRef(name, properties.$ref, required);
    }

    const type: string | undefined = properties.type;

    if (!type) {
      return DataType.generateNameAndType(name, 'any', required);
    } else if (Reflect.has(PROPERTIES_BASE_TYPE_DICT, type)) {
      return DataType.generateBaseDataType(name, Reflect.get(PROPERTIES_BASE_TYPE_DICT, type), required, properties.enum);
    } else if (type === 'array') {
      return DataType.generateArray(name, properties, required);
    } else if (type === 'object') {
      return DataType.generateNameAndType(name, 'object', required);
    } else {
      return DataType.generateNameAndType(name, Serializer.serializeFirstLetterUppercase(type), required);
    }
  }

  // 定义 typescript 基本数据类型
  static generateBaseDataType(name: string, type: string, required = false, enums: any = null): string {
    if (!enums) {
      return DataType.generateNameAndType(name, type, required);
    }
    // 由于枚举不好取名字，所以直接命名为 number 得了
    return DataType.generateNameAndType(name, 'number', required)
  }

  // 定义其他类型的引用
  static generateRef(name: string, ref: string, required = false) {
    return DataType.generateNameAndType(name, Serializer.serializeFirstLetterUppercase(ref.replace(getKeyByVersion(REF_REPLACE_PRFIX), '')), required);
  }

  // 定义数组的数据类型
  static generateArray(name: string, properties: any, required = false) {
    return (properties.items.$ref ?
      DataType.generateRef(name, properties.items.$ref, required) :
      DataType.generateDataType(name, properties.items, required)
    )
      + '[]';
  }

  static generateNameAndType(name: string, type: string, required = false) {

    return `${DataType.commentCode}\n${name}${required ? '' : '?'}: ${type}`;
  }
}


const genComment = (comment: string) => {
  if (!comment) return ''
  let code = '/**\n'
  code += comment
    .split(/\n|\r\n/)
    .map(line => {
      return `* ${line}\n`
    })
    .filter(item => !!item)
    .join('')
  return `${code}*/`
}

//commentCode = `\n${genComment(property.description)}`
