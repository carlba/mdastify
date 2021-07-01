import { Node } from 'unist';
import unified from 'unified';
import remarkStringify from 'remark-stringify';
import remarkParse from 'remark-parse';
import visit from 'unist-util-visit-parents';

interface HeadingNode extends Node {
  type: 'heading';
  children?: TextNode[];
  depth: number;
}

interface TextNode extends Node {
  type: 'text';
  value: string;
}

function numberedHeadings() {
  return (tree: Node) => {
    let currentHeading = [0, 0, 0, 0];
    visit(tree, 'heading', (node: HeadingNode) => {
      currentHeading = currentHeading.map((heading, index) => (node.depth - 1 < index ? 0 : heading));
      currentHeading[node.depth - 1] = currentHeading[node.depth - 1] += 1;
      node.children = node.children?.map(child => {
        return child.type === 'text' ? { ...child, value: `${currentHeading.join('.')} ${child.value}` } : child;
      });
      return visit.CONTINUE;
    });
  };
}

async function parse() {
  const mdast = unified().use(remarkParse).use(remarkStringify).parse(`
  # First Level 1 Heading
  
  # Second Level 1 Heading
    
  This is some text
  ##  Second Level 1 Heading First Level 2 Subheading
  ##  Second Level 1 Heading Second Level 2 Subheading
  ### Second Level 1 Heading Second Level 2 Subheading First Level3 SubHeading

  # Third Level 1 Heading
  ## Third Level 1 Heading First Level 2 Subheading
  `);
  const output = await unified().use(numberedHeadings).use(remarkStringify).run(mdast);
  const markdown = unified().use(remarkStringify).stringify(output);
  console.log(markdown);
}

parse();
