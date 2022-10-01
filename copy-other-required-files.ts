import { basename } from 'path';
import { cp } from 'fs';
import copydir from 'copy-dir';

cp('./open-api.json', './dist/open-api.json', (error) => {
  if (error) {
    throw error;
  }
});

copydir('./node_modules/swagger-ui-dist', './dist/', {
  filter: (_, filepath) => {
    const filename = basename(filepath);

    return filename.startsWith('swagger-ui') || filename.startsWith('favicon');
  }
});
