import { DataType } from "./dataType";
import { BASE_PATH, getKeyByVersion } from "./define";
import { get } from "./helper";
import { APIGenerater } from "./main";
import { IPathSerialized, Serializer } from "./serializer";

let requestMethodParamsTypeCode = '';

const PARAMS_METHOD = new Set(['get', 'delete', 'GET', 'DELETE']);

export class GenerateRequestMethod {
  static run(APIGenerater: APIGenerater) {
    const sourceCode = APIGenerater.sourceCode;
    const requestMethodCode = GenerateRequestMethod.generateFunction(sourceCode.paths, get(sourceCode, getKeyByVersion(BASE_PATH)));

    return [requestMethodParamsTypeCode, requestMethodCode];
  }

  // 生成paths定义，其实就是生成各个方法的定义
  static generateFunction(paths: any, basePath: string): string {

    let requestMethodCode = '';

    for (const path in paths) {
      const pathInfo: IPathSerialized = Serializer.serializePath(path);

      for (const method in paths[path]) {
        // 请求方法命名，例如 getApiV1Sku
        const methodName = Serializer.serializeName(method + pathInfo.sPath);

        // 请求参数组装，例如  getApiV1SkuRequest

        const paramName = GenerateRequestMethod.generateRequest(methodName + 'Request', paths[path][method].parameters);

        // 返回参数组装，例如  getApiV1SkuResponse
        const responseName = GenerateRequestMethod.generateResponse(methodName + 'Response', paths[path][method].responses);

        // 请求URL组装，譬如出现 /:id 这样的情况，所以需要特殊处理
        // (id: string | number, params?: xx)
        // (params?: xx)
        // 对不同的请求方法添加不同的请求参数
        const isGetAndDelete = PARAMS_METHOD.has(method)

        // const paramsType = isGetAndDelete ? '{ params, headers }' : 'body, headers';

        const paramsType = isGetAndDelete ? 'params' : 'body';
        const paramsHeaders = 'headers';
        const methodParams = `(${pathInfo.isPathPrams ? 'id: string | number, ' : ''}${isGetAndDelete ? 'params' : 'body'}?: ${paramName}, headers?: any)`;

        //  对response进行包裹，增加 ErrorCode等参数
        // const responseTypeWrapper = `Promise<${`[ErrorCode | null, ${responseName}]`}>`;

        const responseTypeWrapper = `Taro.RequestTask<GenericData<${responseName}>>`;

        const URLPathPrefix = `'${basePath}${pathInfo.prefix}'`;

        // 'xx/' + id + '/xx'
        // 'xx/' + id
        const URLPathSuffix = `${pathInfo.isPathPrams ? ' + id' : ''}${pathInfo.suffix
          ? ' + \'' + pathInfo.suffix + '\''
          : ''}`;

        const URLPath = URLPathPrefix + URLPathSuffix;

        const ajaxMethod = `request.${method}<${paramName},GenericData<${responseName}>>(${URLPath}, ${paramsType}, 'broker',${paramsHeaders})`;

        // requestMethodCode += `export const ${methodName} = ${methodParams} : ${responseTypeWrapper} => requestWrapper<${responseName}>(${ajaxMethod})\n\n`;
        requestMethodCode += `export const ${methodName} = ${methodParams} : ${responseTypeWrapper} => ${ajaxMethod}\n\n`;

      }
    }
    return requestMethodCode;
  }
  // 定义请求参数
  static generateRequest(name: string, params: any): string {
    if (!params) return 'any';
    const upName = Serializer.serializeFirstLetterUppercase(name);
    let paramsCode = '';
    for (const param of params) {

      // params 判定
      if (param.in === 'path') {
        continue;
      }

      // body 判定
      if (param.in === 'body') {
        // 引用判定
        if (param.schema && param.schema.$ref) {
          requestMethodParamsTypeCode += `export type ${upName} = ${Serializer.serializeFirstLetterUppercase(param.schema.$ref.replace('#/definitions/', '',))
            };\n\n`;
          return upName;
        }
      }
      // query 判定
      // console.log(param);
      paramsCode += `  ${DataType.generateDataType(param.name, param, param.required)};\n`;
    }

    requestMethodParamsTypeCode += `export interface ${Serializer.serializeFirstLetterUppercase(name)} {\n${paramsCode}}\n\n`;

    return upName; // 返回给 method 使用，保持 type 引用
  }

  // 定义返回参数
  static generateResponse(name: string, response: any): string {
    const upname = Serializer.serializeFirstLetterUppercase(name);

    if (!response || !response['200']) return 'any';
    response = response['200'];

    if (response.schema) {
      let isArray = false;
      let $ref;
      let typeName;

      if (response.schema.type === 'array') {
        $ref = response.schema.items.$ref;
        isArray = true;
      } else {
        $ref = response.schema.$ref;
      }

      // if ($ref) {
      //   const refName = Serializer.serializeFirstLetterUppercase($ref.replace('#/definitions/', '')) + (isArray ? '[]' : '');
      //   typeName = isArray ? `{ list: Required<${refName}>, total: number, current: number }` : `Required<${refName}>`;
      // } else {
      //   typeName = `Required<${response.schema.type}>`;
      // }

      if ($ref) {
        const refName = Serializer.serializeFirstLetterUppercase($ref.replace('#/definitions/', '')) + (isArray ? '[]' : '');
        typeName = isArray ? `{ list: ${refName}, total: number, current: number }` : `${refName}`;
      } else {
        typeName = `${response.schema.type}`;
      }

      requestMethodParamsTypeCode += `export type ${upname} = ${typeName};\n\n`;

      return upname;
    }

    return 'any';
  }
}
