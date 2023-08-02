import { ethers } from 'ethers';

import { RoutingType } from '../../constants';
import { ClassicRequest, DutchRequest, Quote, QuoteRequest } from '../../entities';

import { Permit2Fetcher } from '../../fetchers/Permit2Fetcher';
import { log } from '../../util/log';
import { ClassicQuoteContext } from './ClassicQuoteContext';
import { DutchQuoteContext } from './DutchQuoteContext';

export * from './ClassicQuoteContext';
export * from './DutchQuoteContext';

export type RequestByKey = {
  [key: string]: QuoteRequest;
};

export type QuoteByKey = {
  [key: string]: Quote;
};

export interface QuoteContext {
  routingType: RoutingType;
  // base request of the context
  request: QuoteRequest;

  dependencies(): QuoteRequest[];

  // params should be in the same order as dependencies response
  // but resolved with quotes
  // returns null if no usable quote is resolved
  resolve(dependencies: QuoteByKey): Promise<Quote | null>;
}

// handler for quote contexts and their dependencies
export class QuoteContextManager {
  constructor(public contexts: QuoteContext[]) {}

  // deduplicate dependencies
  // note this prioritizes user-defined configs first
  // then synthetic generated configs
  getRequests(): QuoteRequest[] {
    const requestMap: RequestByKey = {};
    // first add base user defined requests
    for (const context of this.contexts) {
      requestMap[context.request.key()] = context.request;
    }

    // add any extra dependency requests
    for (const context of this.contexts) {
      const dependencies = context.dependencies();
      for (const request of dependencies) {
        const requestKey = request.key();
        if (!requestMap[requestKey]) {
          requestMap[requestKey] = request;
        }
      }
    }

    log.info({ requests: requestMap }, `Context requests`);

    return Object.values(requestMap);
  }

  // resolve quotes from quote contexts using quoted dependencies
  async resolveQuotes(quotes: Quote[]): Promise<(Quote | null)[]> {
    log.info({ quotes }, `Context quotes`);
    const allQuotes: QuoteByKey = {};
    for (const quote of quotes) {
      allQuotes[quote.request.key()] = quote;
    }

    const resolved = await Promise.all(
      this.contexts.map((context) => {
        return context.resolve(allQuotes);
      })
    );

    return resolved;
  }
}

export function parseQuoteContexts(
  requests: QuoteRequest[],
  permit2Fetcher: Permit2Fetcher,
  provider: ethers.providers.JsonRpcProvider
): QuoteContext[] {
  return requests.map((request) => {
    switch (request.routingType) {
      case RoutingType.DUTCH_LIMIT:
        return new DutchQuoteContext(log, request as DutchRequest, provider);
      case RoutingType.CLASSIC:
        return new ClassicQuoteContext(log, request as ClassicRequest, permit2Fetcher);
      default:
        throw new Error(`Unsupported routing type: ${request.routingType}`);
    }
  });
}
