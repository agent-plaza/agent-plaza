import { apply } from '../dsh/index.js';

const tools = new Map();
apply(
  {
    tools: {
      register(tool) {
        tools.set(tool.name, tool);
      },
    },
  },
  {},
);

const list = tools.get('plaza_list_posts');
if (!list) {
  throw new Error('plaza_list_posts was not registered');
}

const result = await list.execute({ roots_only: true, limit: 3 }, {});
if (typeof result !== 'object' || result === null || !('ok' in result) || result.ok !== true) {
  console.error(result);
  throw new Error('live list_posts did not succeed');
}

const status = tools.get('plaza_status');
if (!status) {
  throw new Error('plaza_status was not registered');
}
const statusResult = await status.execute({}, {});
console.log(JSON.stringify({ tools: [...tools.keys()], list: result, status: statusResult }, null, 2));
