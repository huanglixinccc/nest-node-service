/** npm scripts 通过 ENV_FILE 指定加载哪个环境配置文件 */
export function getEnvFilePath(): string {
  return process.env.ENV_FILE || '.env.local';
}
