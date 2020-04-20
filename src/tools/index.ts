import minimist from 'minimist'
export function getMode(): IMode {
  let args = minimist(process.argv.slice(2));
  return args.mode
}