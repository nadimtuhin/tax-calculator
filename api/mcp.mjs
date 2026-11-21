import { createRemoteHandler } from '../packages/mcp/src/remote.js';

const handler = createRemoteHandler();

export default { fetch: (request) => handler(request) };
