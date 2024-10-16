import capitalize from 'capitalize';
import dayjs from 'dayjs';
import slugify from 'slugify';
import YAML from 'yaml';
import { z } from 'zod';

import config from '../../shared/config';
import { type Archive } from '../../shared/metadata';
import { parseFilename, parseSourceName } from './utils';

const metadataSchema = z.object({
	title: z.string(),
	language: z.string().optional(),
	date: z.string().optional(),
	tags: z.array(z.string()).optional(),
	category: z.string().optional(),
	gallery_id: z.number().optional(),
	gallery_token: z.string().optional(),
});

export default async (content: string, archive: Archive) => {
	archive = structuredClone(archive);

	const parsed = YAML.parse(content);
	const metadata = metadataSchema.safeParse(parsed);

	if (!metadata.success) {
		console.error(metadata.error);

		throw new Error('Failed to parse Gallery-DL metadata');
	}

	if (config.metadata?.parseFilenameAsTitle) {
		archive.title = parseFilename(metadata.data.title)[0] ?? metadata.data.title;
	} else {
		archive.title = metadata.data.title;
	}

	archive.slug = slugify(archive.title, { lower: true, strict: true });
	archive.language = metadata.data.language;
	archive.released_at = metadata.data.date
		? dayjs(metadata.data.date, 'YYYY-M-D HH:mm:ss').toDate()
		: undefined;

	if (metadata.data.tags) {
		const artists: string[] = [];
		const circles: string[] = [];
		const parodies: string[] = [];
		const tags: [string, string][] = [];

		for (const tag of metadata.data.tags) {
			const [namespace, name] = tag.split(':');

			if (namespace === 'language') {
				continue;
			}

			if (!name) {
				tags.push([
					config.metadata.capitalizeTags ? capitalize.words(namespace) : namespace,
					'misc',
				] as [string, string]);

				continue;
			}

			switch (namespace) {
				case 'artist':
					artists.push(
						config.metadata.capitalizeTags
							? config.metadata.capitalizeTags
								? capitalize.words(name)
								: name
							: name
					);
					break;
				case 'group':
					circles.push(config.metadata.capitalizeTags ? capitalize.words(name) : name);
					break;
				case 'parody':
					parodies.push(config.metadata.capitalizeTags ? capitalize.words(name) : name);
					break;
				case 'male':
				case 'female':
					tags.push([config.metadata.capitalizeTags ? capitalize.words(name) : name, namespace] as [
						string,
						string,
					]);
					break;
				case 'other':
				default:
					tags.push([config.metadata.capitalizeTags ? capitalize.words(name) : name, 'misc'] as [
						string,
						string,
					]);
					break;
			}
		}

		if (artists.length) {
			archive.artists = artists;
		}

		if (circles.length) {
			archive.circles = circles;
		}

		if (parodies.length) {
			archive.parodies = parodies;
		}

		if (tags.length > 0) {
			archive.tags = tags;
		}
	}

	if (metadata.data.category) {
		if (metadata.data.category === 'e-hentai' || metadata.data.category === 'exhentai') {
			const url = `https://${metadata.data.category}/g/${metadata.data.gallery_id}/${metadata.data.gallery_token}`;

			archive.sources = [
				{
					name: parseSourceName(url),
					url,
				},
			];
		}
	}

	archive.has_metadata = true;

	return archive;
};
