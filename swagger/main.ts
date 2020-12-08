import * as http from "http";
import * as https from "https";
import { parse } from "url";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";
import { setVersion } from "./define";
import { GenerateInterface } from "./interface";
import { GenerateRequestMethod } from "./method";

//swagger文档地址
const BASE_SWAGGER_URL = "xxxxxxxxx";

export class APIGenerater {
  baseSwaggerURL: string = BASE_SWAGGER_URL;
  sourceCode: any = null; // 由 swagger 地址请求下来的代码，并解析为json

  interfaceCode: string = ''; // 各个类型的声明，包含 request、reponse 的定义
  requestMethodParamsTypeCode: string = ''; // 函数参数声明
  requestMethodCode: string = ''; // 请求方法体定义

  ouputfileName: string = 'api.ts'; // 输出文件名 
  ouputfilePath: string = 'src/api/api.ts'; // 输出路径

  async run(): Promise<void> {
    this.sourceCode = JSON.parse(await this.getSwaggerJson(this.baseSwaggerURL));

    if (!this.sourceCode) {
      throw new Error("swagger JSON 解析失败");
    }

    setVersion(this.sourceCode);

    this.generateInteraceCode();
    this.generateRequestMethodCode();
    this.writeFile();
  }

  generateInteraceCode(): void {
    this.interfaceCode = GenerateInterface.run(this);
  }

  generateRequestMethodCode(): void {
    const [requestMethodParamsTypeCode, requestMethodCode] = GenerateRequestMethod.run(this);
    this.requestMethodParamsTypeCode = requestMethodParamsTypeCode;
    this.requestMethodCode = requestMethodCode;
  }

  writeFile(): void {

    const code = "/**本文件根据swagger文档自动生成，请勿手动修改*/\n\n" +
      "import Taro from '@tarojs/taro';\n" +
      "import request from '@/server/request';\n\n" +
      "export type GenericData<T> = { data: T; errcode: number; errmsg: string };\n\n" +
      this.interfaceCode +
      this.requestMethodParamsTypeCode +
      this.requestMethodCode;



    const dname = dirname(this.ouputfilePath);
    if (!existsSync(dname)) {
      mkdirSync(dname, { recursive: true });
    }

    writeFileSync(this.ouputfilePath, code);
  }

  getSwaggerJson(swaggerUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const requestProtocol = parse(swaggerUrl).protocol === 'http:' ? http : https;
      requestProtocol.request(swaggerUrl, res => {
        res.setEncoding("utf8");
        let str = "";

        res.on("data", data => {
          str += data.toString();
        });
        res.on("end", () => {
          resolve(str);
        });
        res.on("error", err => {
          reject(err);
        });
      }).end();
    });
  }
}



new APIGenerater().run();