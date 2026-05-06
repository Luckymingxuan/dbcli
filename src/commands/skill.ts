import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(CURRENT_FILE_PATH);
const SKILL_SOURCE_PATH = path.resolve(CURRENT_DIR, '..', '..', 'skills', 'SKILL.md');

interface SkillOptions {
  output?: string;
}

export async function skill(options: SkillOptions): Promise<void> {
  let skillContent: string;

  try {
    skillContent = await fs.readFile(SKILL_SOURCE_PATH, 'utf-8');
  } catch {
    console.error(`Skill source not found: ${SKILL_SOURCE_PATH}`);
    process.exit(1);
  }

  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, skillContent, 'utf-8');
    console.log(`Skill written to ${outputPath}`);
    return;
  }

  console.log(skillContent);
}
