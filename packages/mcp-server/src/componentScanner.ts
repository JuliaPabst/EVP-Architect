import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Component {
  name: string;
  category: string;
  path: string;
  hasStyles: boolean;
  hasTests: boolean;
}

interface ComponentInfo extends Component {
  props?: string;
  sourcePreview?: string;
  description?: string;
}

const CATEGORIES = ['atoms', 'molecules', 'organisms', 'compositions', 'hooks'];

/**
 * Scan the UI directory for components
 */
export async function scanComponents(
  uiPath: string,
  category: string = 'all'
): Promise<Component[]> {
  const components: Component[] = [];
  const basePath = path.resolve(__dirname, uiPath);

  const categoriesToScan = category === 'all' ? CATEGORIES : [category];

  for (const cat of categoriesToScan) {
    const categoryPath = path.join(basePath, cat);
    
    try {
      const exists = await fs.access(categoryPath).then(() => true).catch(() => false);
      if (!exists) continue;

      const items = await fs.readdir(categoryPath);

      for (const item of items) {
        const itemPath = path.join(categoryPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          const hasIndex = await fs.access(path.join(itemPath, 'index.tsx'))
            .then(() => true)
            .catch(() => false);
          
          if (hasIndex) {
            const hasStyles = await fs.access(path.join(itemPath, 'index.scss'))
              .then(() => true)
              .catch(() => false);
            
            const hasTests = await fs.access(path.join(itemPath, 'index.spec.tsx'))
              .then(() => true)
              .catch(() => false);

            components.push({
              name: item,
              category: cat,
              path: path.relative(basePath, itemPath),
              hasStyles,
              hasTests,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning category ${cat}:`, error);
    }
  }

  return components.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get detailed information about a specific component
 */
export async function getComponentInfo(
  uiPath: string,
  componentName: string
): Promise<ComponentInfo> {
  const components = await scanComponents(uiPath, 'all');
  const component = components.find(
    (c) => c.name.toLowerCase() === componentName.toLowerCase()
  );

  if (!component) {
    throw new Error(`Component "${componentName}" not found`);
  }

  const basePath = path.resolve(__dirname, uiPath);
  const componentPath = path.join(basePath, component.category, component.name);
  const indexPath = path.join(componentPath, 'index.tsx');

  try {
    const source = await fs.readFile(indexPath, 'utf-8');
    
    // Extract props interface/type
    const propsMatch = source.match(/interface\s+\w*Props\s*{[\s\S]*?}|type\s+\w*Props\s*=\s*{[\s\S]*?}/);
    const props = propsMatch ? propsMatch[0] : undefined;

    // Extract JSDoc comment if exists
    const descMatch = source.match(/\/\*\*[\s\S]*?\*\//);
    const description = descMatch ? descMatch[0] : undefined;

    // Get first 20 lines as preview
    const lines = source.split('\n').slice(0, 20).join('\n');

    return {
      ...component,
      props,
      description,
      sourcePreview: lines,
    };
  } catch (error) {
    throw new Error(`Failed to read component info: ${error}`);
  }
}

/**
 * Search for components by name or keyword
 */
export async function searchComponents(
  uiPath: string,
  query: string
): Promise<Component[]> {
  const allComponents = await scanComponents(uiPath, 'all');
  const lowerQuery = query.toLowerCase();

  return allComponents.filter((component) =>
    component.name.toLowerCase().includes(lowerQuery) ||
    component.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get the source code of a component file
 */
export async function getComponentSource(
  uiPath: string,
  componentName: string,
  fileType: string = 'tsx'
): Promise<string> {
  const components = await scanComponents(uiPath, 'all');
  const component = components.find(
    (c) => c.name.toLowerCase() === componentName.toLowerCase()
  );

  if (!component) {
    throw new Error(`Component "${componentName}" not found`);
  }

  const basePath = path.resolve(__dirname, uiPath);
  const componentPath = path.join(basePath, component.category, component.name);
  
  let filePath: string;
  switch (fileType) {
    case 'tsx':
      filePath = path.join(componentPath, 'index.tsx');
      break;
    case 'scss':
      filePath = path.join(componentPath, 'index.scss');
      break;
    case 'spec':
      filePath = path.join(componentPath, 'index.spec.tsx');
      break;
    default:
      throw new Error(`Invalid file type: ${fileType}`);
  }

  try {
    const source = await fs.readFile(filePath, 'utf-8');
    return source;
  } catch (error) {
    throw new Error(`Failed to read ${fileType} file: ${error}`);
  }
}
