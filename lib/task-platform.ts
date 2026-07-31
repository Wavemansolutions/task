export const taskPlatforms = [
  'facebook',
  'instagram',
  'x',
  'youtube',
  'tiktok',
  'telegram',
  'whatsapp',
  'linkedin',
  'google',
  'trustpilot',
  'general',
] as const;

export type TaskPlatform = (typeof taskPlatforms)[number];

export function detectTaskPlatform(input: {
  social_platform?: string | null;
  type?: string | null;
  title?: string | null;
  description?: string | null;
}): TaskPlatform {
  const explicit = String(input.social_platform ?? '').toLowerCase();
  if (taskPlatforms.includes(explicit as TaskPlatform)) return explicit as TaskPlatform;

  const text = `${input.type ?? ''} ${input.title ?? ''} ${input.description ?? ''}`.toLowerCase();
  if (text.includes('instagram')) return 'instagram';
  if (text.includes('youtube') || text.includes('subscribe')) return 'youtube';
  if (text.includes('tiktok')) return 'tiktok';
  if (text.includes('telegram')) return 'telegram';
  if (text.includes('whatsapp') || text.includes('status')) return 'whatsapp';
  if (text.includes('linkedin')) return 'linkedin';
  if (text.includes('trustpilot')) return 'trustpilot';
  if (text.includes('google')) return 'google';
  if (text.includes('twitter') || text.includes('retweet') || /(^|\s)x(\s|$)/.test(text)) return 'x';
  if (text.includes('facebook')) return 'facebook';
  return 'general';
}

export function generatedTaskThumbnail(platform: string) {
  const safe = taskPlatforms.includes(platform as TaskPlatform) ? platform : 'general';
  return `/task-thumbnails/${safe}.svg`;
}
