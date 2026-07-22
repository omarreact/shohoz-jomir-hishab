export class RajukTokenExpiredError extends Error {
  constructor(message: string = "Rajuk token has expired") {
    super(message);
    this.name = "RajukTokenExpiredError";
  }
}

export class RajukProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RajukProviderError";
  }
}

export class RajukCacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RajukCacheError";
  }
}

export class ProxyError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = "ProxyError";
  }
}
