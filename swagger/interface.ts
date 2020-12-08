import { getKeyByVersion, INTERFACE_CODE_KEY } from "./define";
import { Serializer } from "./serializer";
import { get } from "./helper";
import { APIGenerater } from "./main";
import { DataType } from "./dataType";

export class GenerateInterface {
  static run(APIGenerater: APIGenerater) {
    let interfaceCode = '';
    const definitions = get(APIGenerater.sourceCode, getKeyByVersion(INTERFACE_CODE_KEY));

    for (const attr in definitions) {
      console.log('attr->', attr)
      interfaceCode += GenerateInterface.generate(attr, definitions[attr]);
    }
    return interfaceCode;
  }

  static generate(name: string, value: any): string {

    let body = '';
    for (const property in value.properties) {

      body += `  ${DataType.generateDataType(
        property,
        value.properties[property],
        value.required ? value.required.includes(property) : false)
        };\n`;
    }
    return `export interface ${Serializer.serializeFirstLetterUppercase(name)} {\n${body}}\n\n`;
  }
}