import * as path from 'path';
import * as fs from 'fs';

let counter = 2;

const traverseFolder = (folderPath, parentName = '') => {
  const files = fs.readdirSync(folderPath);
  const tree = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const children = traverseFolder(
        filePath,
        parentName ? `${parentName}/${file}` : file,
        counter,
      );

      const node = {
        label: file,
        key: `${counter++}`,
        path: parentName ? `/${parentName}/${file}` : `/${file}`,
        // path: filePath,
      };

      if (children.length) {
        node.children = children;
      }

      tree.push(node);
    }
  }

  return tree;
};

(() => {
  const folderPath = path.resolve('./src/app');
  const result = traverseFolder(folderPath);

  result.unshift({
    key: '1',
    label: 'home',
    path: '/',
  });

  const folder = path.resolve('./src/utils/menu/folder.ts');
  // console.log(result);
  fs.writeFileSync(
    folder,
    `export const MENU_PATH_DATA = ${JSON.stringify(result, null, 2)}
    `,
  );

  console.log(`menu info 👉🏻 ${folder}`);
})();
