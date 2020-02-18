# jupyter-sync

> 
[![Not Maintained](https://img.shields.io/badge/Maintenance%20Level-Not%20Maintained-yellow.svg)](https://gist.github.com/cheerfulstoic/d107229326a01ff0f333a1d3476e068d) [![Greenkeeper badge](https://badges.greenkeeper.io/schul-cloud/jupyter-sync.svg)](https://greenkeeper.io/)

## About

This project is supposed to sync the File system of JupyterHub with the schul-cloud@hpi.

## Getting Started

1a. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
1b. [MongoDB](https://www.mongodb.com/) ist required.
2. Install your dependencies

    ```
    cd path/to/jupyter-sync; npm install
    ```

3. Start your app

    ```
    npm run dev
    ```

## ToDO

- [x] pull File from SC
- [x] sync changed files after restart
- [x] sync file changes
- [x] sync new Files
- [x] enforce security
  - [x] sync
  - [x] files
  - [x] directory
- [x] delete file
- [x] rename file
- [x] create directories
- [x] delete directories
  - [x] recursive/force delete
- [x] adjust services to new SC FileService
- [ ] introduce concept on SC for latest file changes while being offline/last sync
- [ ] maybe generate superhero JWT less often, save it globally (30d valid)
- [ ] use winston
- [ ] add case for _data folder from docker
- [x] adjust tests to new SC FileService
- [ ] consider removing user service again and just create baseDir - JupyterHub
- [ ] add After hooks in SC Server (Create/Remove for folder/file), had to abandon my branch as everything changed

## Current challenges
The Creation/Deletion flow is pretty much like a circle you trigger one you trigger all...
Integrate checks before creation/deletion whether specific files already exist or got deleted to break out of the circle.

Never checked under windows, so rather use mac or linux for development.

## Envs

```
ACCESS_KEY - known secret between servers
```
```
BACKEND_URL
```
Needs a superhero account to forge JWTs to sync data
```
ADMIN_NAME
```
```
ADMIN_PW
```
```
WATCH_PATH - complete path to watch
```

## Misc
Directories and Files are both services that are open to the outside.
SyncService is only for internal communication.

SyncService ==> SC FileService

SC FileService ==> Directories and Files Service

### JupyterHub specifics
based on the configuration specified [here](https://docs.schul-cloud.org/display/~lars.lange/Jupyterhub).

Use a vm that is specially setup for this use case.
Run the project as root user to have full access to the mounted docker volumes.
```
/var/lib/docker/volumes
```
Folders are created in the form of:
```
jupyterhub-user-id
```
in which the _data folder lies.
