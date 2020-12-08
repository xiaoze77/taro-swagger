export const INTERFACE_CODE_KEY = 'INTERFACE_CODE_KEY';
export const BASE_PATH = 'BASE_PATH';
export const REF_REPLACE_PRFIX = 'REF_REPLACE_PRFIX';

export const enum EVersion {
  SWAGGER_2 = 'swagger_2',
  OPENAPI_3 = 'openapi_3',
}

export const VERSION_KEY_DICT: IVersion = {
  version: EVersion.SWAGGER_2,

  [ EVersion.SWAGGER_2 ]: {
    [ INTERFACE_CODE_KEY ]: 'definitions',
    [ BASE_PATH ]: 'basePath',
    [ REF_REPLACE_PRFIX ]: '#/definitions/',
  },

  [ EVersion.OPENAPI_3 ]: {
    [ INTERFACE_CODE_KEY ]: 'components.schemas',
    [ BASE_PATH ]: 'servers.0.url',
    [ REF_REPLACE_PRFIX ]: '#/components/schemas',
  }
};

export function getKeyByVersion(key: string): string {
  return VERSION_KEY_DICT[ VERSION_KEY_DICT.version ][ key ];
}

export function setVersion(sourceCode: any): void {
  // 确定当前swagger版本
  if (sourceCode.swagger) {
    VERSION_KEY_DICT.version = 'swagger_' + sourceCode.swagger[ 0 ] as EVersion;
  } else if (sourceCode.openapi) {
    VERSION_KEY_DICT.version = 'openapi_' + sourceCode.openapi[ 0 ] as EVersion;
  }
  // ... 别的暂时也不晓得
}

export interface IVersion {
  version: EVersion,

  [ key: string ]: any;
}

