import { ID_TO_CHAIN_ID, WRAPPED_NATIVE_CURRENCY } from '@uniswap/smart-order-router';
import { NATIVE_ADDRESS, RoutingType } from '../../lib/constants';

import {
  ClassicQuoteDataJSON,
  ClassicRequest,
  DutchQuoteJSON,
  DutchRequest,
  parseQuoteRequests,
  QuoteRequestBodyJSON,
} from '../../lib/entities';
import { ClassicQuote, DutchQuote, Quote } from '../../lib/entities/quote';
import { AMOUNT_IN, CHAIN_IN_ID, CHAIN_OUT_ID, FILLER, OFFERER, TOKEN_IN, TOKEN_OUT } from '../constants';
import { buildQuoteResponse } from './quoteResponse';

export const BASE_REQUEST_INFO_EXACT_IN = {
  tokenInChainId: CHAIN_IN_ID,
  tokenOutChainId: CHAIN_OUT_ID,
  requestId: 'requestId',
  tokenIn: TOKEN_IN,
  tokenOut: TOKEN_OUT,
  amount: AMOUNT_IN,
  type: 'EXACT_INPUT',
  offerer: OFFERER,
};

export const REQUEST_INFO_ETH_EXACT_IN = {
  ...BASE_REQUEST_INFO_EXACT_IN,
  tokenIn: NATIVE_ADDRESS,
  tokenOut: TOKEN_IN, // Uni
};

export const BASE_REQUEST_INFO_EXACT_OUT = {
  ...BASE_REQUEST_INFO_EXACT_IN,
  type: 'EXACT_OUTPUT',
};

export const QUOTE_REQUEST_BODY_MULTI: QuoteRequestBodyJSON = {
  ...BASE_REQUEST_INFO_EXACT_IN,
  configs: [
    {
      routingType: RoutingType.DUTCH_LIMIT,
      offerer: OFFERER,
      exclusivityOverrideBps: 12,
      auctionPeriodSecs: 60,
      deadlineBufferSecs: 12,
    },
    {
      routingType: RoutingType.CLASSIC,
      protocols: ['V3', 'V2', 'MIXED'],
    },
  ],
};

export const DL_REQUEST_BODY = {
  ...BASE_REQUEST_INFO_EXACT_IN,
  configs: [
    {
      routingType: RoutingType.DUTCH_LIMIT,
      offerer: OFFERER,
      exclusivityOverrideBps: 12,
      auctionPeriodSecs: 60,
      deadlineBufferSecs: 12,
    },
  ],
};

export const CLASSIC_REQUEST_BODY: QuoteRequestBodyJSON = {
  ...BASE_REQUEST_INFO_EXACT_IN,
  configs: [
    {
      routingType: RoutingType.CLASSIC,
      protocols: ['V3', 'V2', 'MIXED'],
    },
  ],
};

export function makeClassicRequest(overrides: Partial<QuoteRequestBodyJSON>): ClassicRequest {
  const requestInfo = Object.assign({}, BASE_REQUEST_INFO_EXACT_IN, overrides);

  return parseQuoteRequests({
    ...requestInfo,
    configs: [
      {
        routingType: RoutingType.CLASSIC,
        protocols: ['v3'],
        gasPriceWei: '12',
      },
    ],
  }).quoteRequests[0] as ClassicRequest;
}

export const QUOTE_REQUEST_CLASSIC = makeClassicRequest({});

export function makeDutchRequest(overrides: Partial<QuoteRequestBodyJSON>): DutchRequest {
  const requestInfo = Object.assign({}, BASE_REQUEST_INFO_EXACT_IN, overrides);
  return parseQuoteRequests({
    ...requestInfo,
    configs: [
      {
        routingType: RoutingType.DUTCH_LIMIT,
        offerer: OFFERER,
        exclusivityOverrideBps: 12,
        auctionPeriodSecs: 60,
        deadlineBufferSecs: 12,
      },
    ],
  }).quoteRequests[0] as DutchRequest;
}

export const QUOTE_REQUEST_DL = makeDutchRequest({});
export const QUOTE_REQUEST_DL_EXACT_OUT = makeDutchRequest({ type: 'EXACT_OUTPUT' });
export const QUOTE_REQUEST_DL_NATIVE_IN = makeDutchRequest({
  tokenIn: WRAPPED_NATIVE_CURRENCY[ID_TO_CHAIN_ID(CHAIN_IN_ID)].address,
});
export const QUOTE_REQUEST_DL_NATIVE_OUT = makeDutchRequest({
  tokenOut: WRAPPED_NATIVE_CURRENCY[ID_TO_CHAIN_ID(CHAIN_OUT_ID)].address,
});

export const { quoteRequests: QUOTE_REQUEST_MULTI } = parseQuoteRequests({
  ...BASE_REQUEST_INFO_EXACT_IN,
  configs: [
    {
      routingType: RoutingType.DUTCH_LIMIT,
      offerer: OFFERER,
      exclusivityOverrideBps: 12,
      auctionPeriodSecs: 60,
      deadlineBufferSecs: 12,
    },
    {
      routingType: RoutingType.CLASSIC,
      protocols: ['v3', 'v2', 'mixed'],
      gasPriceWei: '12',
    },
  ],
});

export const QUOTE_REQUEST_ETH_IN_MULTI = parseQuoteRequests({
  ...REQUEST_INFO_ETH_EXACT_IN,
  configs: [
    {
      routingType: RoutingType.DUTCH_LIMIT,
      offerer: OFFERER,
      exclusivityOverrideBps: 12,
      auctionPeriodSecs: 60,
      deadlineBufferSecs: 12,
    },
    {
      routingType: RoutingType.CLASSIC,
      protocols: ['v3', 'v2', 'mixed'],
      gasPriceWei: '12',
    },
  ],
});

export const QUOTE_REQUEST_MULTI_EXACT_OUT = parseQuoteRequests({
  ...BASE_REQUEST_INFO_EXACT_OUT,
  configs: [
    {
      routingType: RoutingType.DUTCH_LIMIT,
      offerer: OFFERER,
      exclusivityOverrideBps: 12,
      auctionPeriodSecs: 60,
      deadlineBufferSecs: 12,
    },
    {
      routingType: RoutingType.CLASSIC,
      protocols: ['v3'],
      gasPriceWei: '12',
    },
  ],
});

const DL_QUOTE_DATA = {
  routing: RoutingType.DUTCH_LIMIT,
  quote: {
    chainId: 1,
    requestId: 'requestId',
    quoteId: 'quoteId',
    tokenIn: TOKEN_IN,
    amountIn: '1',
    tokenOut: TOKEN_OUT,
    amountOut: '1',
    offerer: OFFERER,
    filler: FILLER,
  },
};

export const CLASSIC_QUOTE_DATA = {
  routing: RoutingType.CLASSIC,
  quote: {
    requestId: 'requestId',
    quoteId: '1',
    amount: '1',
    amountDecimals: '18',
    quote: '1',
    quoteDecimals: '18',
    quoteGasAdjusted: AMOUNT_IN,
    quoteGasAdjustedDecimals: '18',
    gasUseEstimate: '100',
    gasUseEstimateQuote: '100',
    gasUseEstimateQuoteDecimals: '18',
    gasUseEstimateUSD: '100',
    simulationStatus: 'start',
    gasPriceWei: '10000',
    blockNumber: '1234',
    route: [],
    routeString: 'USD-ETH',
    permitNonce: '1',
    tradeType: 'exactIn',
  },
};

export function createDutchQuote(overrides: Partial<DutchQuoteJSON>, type: string): DutchQuote {
  return buildQuoteResponse(
    Object.assign({}, DL_QUOTE_DATA, {
      quote: { ...DL_QUOTE_DATA.quote, type: RoutingType.DUTCH_LIMIT, ...overrides },
    }),
    makeDutchRequest({ type })
  ) as DutchQuote;
}

export function createClassicQuote(
  overrides: Partial<ClassicQuoteDataJSON>,
  requestOverrides: Partial<QuoteRequestBodyJSON>
): ClassicQuote {
  return buildQuoteResponse(
    Object.assign({}, CLASSIC_QUOTE_DATA, { quote: { ...CLASSIC_QUOTE_DATA.quote, ...overrides } }),
    makeClassicRequest(requestOverrides)
  ) as ClassicQuote;
}

export function createRouteBackToNativeQuote(overrides: Partial<ClassicQuoteDataJSON>, type: string): Quote {
  return buildQuoteResponse(
    Object.assign({}, CLASSIC_QUOTE_DATA, {
      quote: {
        ...CLASSIC_QUOTE_DATA.quote,
        ...overrides,
      },
    }),
    makeClassicRequest({
      type: type,
      tokenIn: TOKEN_OUT,
      tokenOut: WRAPPED_NATIVE_CURRENCY[ID_TO_CHAIN_ID(CHAIN_OUT_ID)].address,
    })
  );
}

export const DL_QUOTE_EXACT_IN_BETTER = createDutchQuote({ amountOut: '2' }, 'EXACT_INPUT');
export const DL_QUOTE_NATIVE_EXACT_IN_BETTER = createDutchQuote(
  { amountOut: '2', tokenIn: WRAPPED_NATIVE_CURRENCY[ID_TO_CHAIN_ID(CHAIN_OUT_ID)].address },
  'EXACT_INPUT'
);
export const DL_QUOTE_EXACT_IN_WORSE_PREFERENCE = createDutchQuote({ amountOut: '100000' }, 'EXACT_INPUT');
export const DL_QUOTE_EXACT_IN_WORSE = createDutchQuote({ amountOut: '1' }, 'EXACT_INPUT');
export const DL_QUOTE_EXACT_IN_LARGE = createDutchQuote({ amountOut: '10000' }, 'EXACT_INPUT');
export const DL_QUOTE_EXACT_OUT_BETTER = createDutchQuote({ amountIn: '1' }, 'EXACT_OUTPUT');
export const DL_QUOTE_EXACT_OUT_WORSE = createDutchQuote({ amountIn: '2' }, 'EXACT_OUTPUT');
export const DL_QUOTE_EXACT_OUT_LARGE = createDutchQuote({ amountOut: '10000' }, 'EXACT_INPUT');

export const CLASSIC_QUOTE_EXACT_IN_BETTER_PREFERENCE = createClassicQuote(
  { quote: '100100', quoteGasAdjusted: '100100' },
  { type: 'EXACT_INPUT' }
);
export const CLASSIC_QUOTE_EXACT_IN_BETTER = createClassicQuote(
  { quote: '2', quoteGasAdjusted: '2' },
  { type: 'EXACT_INPUT' }
);
export const CLASSIC_QUOTE_EXACT_IN_WORSE = createClassicQuote(
  { quote: '1', quoteGasAdjusted: '1' },
  { type: 'EXACT_INPUT' }
);
export const CLASSIC_QUOTE_EXACT_IN_LARGE = createClassicQuote(
  { quote: '10000', quoteGasAdjusted: '9000' },
  { type: 'EXACT_INPUT' }
);
export const CLASSIC_QUOTE_EXACT_IN_LARGE_GAS = createClassicQuote(
  // quote: 1 ETH, quoteGasAdjusted: 0.9 ETH, gasUseEstimate: 100000, gasUseEstimateQuote: 0.1 ETH
  {
    quote: '10000000000000000000000',
    quoteGasAdjusted: '9000000000000000000000',
    gasUseEstimate: '100000',
    gasUseEstimateQuote: '1000000000000000000000',
  },
  { type: 'EXACT_INPUT' }
);

export const CLASSIC_QUOTE_EXACT_IN_NATIVE = buildQuoteResponse(
  Object.assign({}, CLASSIC_QUOTE_DATA, {
    quote: {
      ...CLASSIC_QUOTE_DATA.quote,
      quote: '10000000000000000000000',
      quoteGasAdjusted: '9000000000000000000000',
      gasUseEstimate: '100000',
      gasUseEstimateQuote: '1000000000000000000000',
    },
  }),
  makeClassicRequest({ type: 'EXACT_INPUT', tokenIn: NATIVE_ADDRESS, tokenOut: TOKEN_IN })
);

export const CLASSIC_QUOTE_EXACT_OUT_BETTER = createClassicQuote(
  { quote: '1', quoteGasAdjusted: '1' },
  { type: 'EXACT_OUTPUT' }
);
export const CLASSIC_QUOTE_EXACT_OUT_WORSE = createClassicQuote(
  { quote: '2', quoteGasAdjusted: '2' },
  { type: 'EXACT_OUTPUT' }
);
export const CLASSIC_QUOTE_EXACT_OUT_LARGE = createClassicQuote(
  { quote: '10000', quoteGasAdjusted: '10000' },
  { type: 'EXACT_OUTPUT' }
);
export const CLASSIC_QUOTE_HAS_ROUTE_TO_NATIVE = createRouteBackToNativeQuote(
  {
    quote: '100',
    quoteGasAdjusted: '98',
  },
  'EXACT_OUTPUT'
);
export const CLASSIC_QUOTE_NO_ROUTE_TO_NATIVE = createRouteBackToNativeQuote(
  {
    quote: '100',
    quoteGasAdjusted: '100',
  },
  'EXACT_OUTPUT'
);
