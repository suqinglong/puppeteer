## directory structure

demoTaskData.ts contains demo task data.

memoryTest.ts is a script that watch how many browser instance running and how many tabs opened.

template.test.config.ts is template file for testing config. you should copy it and modify arguments to test.

```shell
copy template.test.config.ts test.config.ts
```

index.ts is the entry file.

## run

To use headless browser

```shell
yarn test
```

To use client browser

```shell
yarn testDev
```
