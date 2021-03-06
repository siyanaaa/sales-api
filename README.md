# ManulifeMOVE Backend Coding Assignment
### Version 1.1.0


#### Using Docker

```bash
docker build -t sales-api .
docker run -d -p 3000:3000 --name sales sales-api
```

#### Prerequisites

Use node 12
```bash
nvm use 12.
```

#### MongoDB as datasource
MongoDB in Local
```bash
service mongod start
```

#### Installation

Install Dependencies
```bash
yarn
```

Production run
```bash
node .
```

### Development

Start server development
```bash
yarn start
```

Run tests
```bash
yarn test
```

### Swagger Url
http://localhost:3000/explorer


[![LoopBack](https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)
