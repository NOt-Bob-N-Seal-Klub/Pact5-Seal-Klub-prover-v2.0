/**
 * Standalone HTTP REST API & Webhook Server for seal-klub-prover.
 */
import http from 'node:http';
export interface ServerConfig {
    port?: number;
    host?: string;
    corsOrigin?: string;
}
export declare function createProverServer(config?: ServerConfig): http.Server;
//# sourceMappingURL=server.d.ts.map