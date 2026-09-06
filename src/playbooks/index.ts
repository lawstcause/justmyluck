import type { PlaybookFile } from '../types';
import { creative } from './creative';
import { dateSocial } from './dateSocial';
import { launch } from './launch';
import { liveEvent } from './liveEvent';
import { shoot } from './shoot';
import { travel } from './travel';

export const PLAYBOOKS: PlaybookFile[] = [liveEvent, travel, creative, dateSocial, launch, shoot];

export function getPlaybook(id: string): PlaybookFile | undefined {
  return PLAYBOOKS.find((playbook) => playbook.id === id);
}
