
const REG_EXCLUDE_LINE = /-(\w)/g; // 匹配 -
const REG_EXCLUDE_SLASH_POINT = /\/(.)?/g; // 匹配 /
const REG_EXCLUDE_POINT = /\.(\w)/g; // 匹配 .
const REG_PATH_PARAMS = /{(.*?)}(.*)/g; // 匹配 /:xx


export interface IPathSerialized {
  isPathPrams: boolean, // 是否包含 params 参数，例如 xx/:id
  path: string, // 原路径
  sPath: string, // 序列化后的路径
  prefix: string, // 序列化后的路径前缀
  suffix: string, // 序列化后的路径后缀
}

export class Serializer {
  // 序列化Method，例如将 /:id ===> xxById
  // 但是可能存在如此接口，xx/:id/yy，所以需要使用前缀(prefix) + id + 后缀(suffix)来拼接
  static serializePath(path: string): IPathSerialized {
    const result: IPathSerialized = {
      isPathPrams: false,
      path,
      sPath: path,
      prefix: path,
      suffix: '',
    };

    // 匹配 xx/{id}/xx
    if (REG_PATH_PARAMS.test(path)) {
      result.sPath = Serializer.serializeName(path.replace(REG_PATH_PARAMS, (m, m1, m2) => {
        result.isPathPrams = true;

        result.prefix = path.replace(m, '');
        result.suffix = m2;

        return `by/${m1}${m2}`;
      }))
    }

    return result;
  }

  // 序列化名字，去掉名字中间的 "- . _"
  static serializeName(name: string): string {
    // ts-ignore
    return name.replace(REG_EXCLUDE_LINE, (_s1, s2) => s2.toUpperCase()).
      replace(REG_EXCLUDE_SLASH_POINT, (_s1, s2) => {
        return s2 ? s2.toUpperCase() : '';
      }).
      replace(REG_EXCLUDE_POINT, (_s1, s2) => s2.toUpperCase());
  }

  static serializeFirstLetterUppercase(str: string): string {
    if (!str) return '';
    str = Serializer.serializeName(str);
    return str[0].toUpperCase() + str.slice(1);
  }
}
