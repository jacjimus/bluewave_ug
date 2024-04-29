/*instrumentation.ts*/
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { PrometheusExporter } = require("@opentelemetry/exporter-prometheus");

const options = {
  url: 'http://localhost:9411/api/v2/spans',
  headers: {
    'Content-Type': 'application/json',
  },
  // Optional interceptor for custom headers per request
  getExportRequestHeaders: () => ({
    'X-Special-Header': 'very special',
  }),
  serviceName: 'bluewave',
};

const exporter = new ZipkinExporter(options);

const jaegerExporter = new JaegerExporter();
const prometheusExporter = new PrometheusExporter();


const sdk = new NodeSDK({
  // coonfiguration options zipkin
   traceExporter: exporter,

    // Optional - if omitted, the tracing SDK will be initialized from environment variables
   // traceExporter: jaegerExporter,
    // Optional - If omitted, the metrics SDK will not be initialized
    metricReader: prometheusExporter,
    // Optional - you can use the metapackage or load each instrumentation individually
    instrumentations: [getNodeAutoInstrumentations()],
    // See the Configuration section below for additional  configuration options
  // traceExporter: new ConsoleSpanExporter(),
  // metricReader: new PeriodicExportingMetricReader({
  //   exporter: new ConsoleMetricExporter(),
  // }),
  // instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();



