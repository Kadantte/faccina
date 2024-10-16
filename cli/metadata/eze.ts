import capitalize from 'capitalize';
import dayjs from 'dayjs';
import arraySupport from 'dayjs/plugin/arraySupport';
import slugify from 'slugify';
import YAML from 'yaml';
import { z } from 'zod';

import config from '../../shared/config';
import { type Archive } from '../../shared/metadata';
import { parseFilename, parseSourceName } from './utils';

dayjs.extend(arraySupport);

const metadataSchema = z.object({
	title: z.string(),
	tags: z.record(z.string(), z.array(z.string())).optional(),
	language: z.string().optional(),
	upload_date: z.array(z.number()).optional(),
	source: z
		.object({
			site: z.string(),
			gid: z.number(),
			token: z.string(),
		})
		.optional(),
});

export default async (content: string, archive: Archive) => {
	archive = structuredClone(archive);

	const parsed = YAML.parse(content);
	const metadata = metadataSchema.safeParse(parsed);

	if (!metadata.success) {
		console.error(metadata.error);

		throw new Error('Failed to parse Eze metadata');
	}

	if (config.metadata?.parseFilenameAsTitle) {
		archive.title = parseFilename(metadata.data.title)[0] ?? metadata.data.title;
	} else {
		archive.title = metadata.data.title;
	}

	archive.slug = slugify(archive.title, { lower: true, strict: true });
	archive.language = metadata.data.language;

	if (metadata.data.upload_date && metadata.data.upload_date.filter((x) => x).length == 6) {
		const [year, month, day, hour, min, sec] = metadata.data.upload_date;

		archive.released_at = dayjs([year, month + 1, day, hour, min, sec]).toDate();
	}

	if (metadata.data.tags) {
		archive.artists = metadata.data.tags['artist']?.map((value) =>
			config.metadata.capitalizeTags
				? config.metadata.capitalizeTags
					? capitalize.words(value)
					: value
				: value
		);
		archive.circles = metadata.data.tags['group']?.map((value) =>
			config.metadata.capitalizeTags ? capitalize.words(value) : value
		);
		archive.parodies = metadata.data.tags['parody']?.map((value) =>
			config.metadata.capitalizeTags ? capitalize.words(value) : value
		);

		const tags: [string, string][] = [];

		if (metadata.data.tags['male']) {
			tags.push(
				...metadata.data.tags['male'].map(
					(tag) =>
						[config.metadata.capitalizeTags ? capitalize.words(tag) : tag, 'male'] as [
							string,
							string,
						]
				)
			);
		}

		if (metadata.data.tags['female']) {
			tags.push(
				...metadata.data.tags['female'].map(
					(tag) =>
						[config.metadata.capitalizeTags ? capitalize.words(tag) : tag, 'female'] as [
							string,
							string,
						]
				)
			);
		}

		if (metadata.data.tags['misc']) {
			tags.push(
				...metadata.data.tags['misc'].map(
					(tag) =>
						[config.metadata.capitalizeTags ? capitalize.words(tag) : tag, 'misc'] as [
							string,
							string,
						]
				)
			);
		}

		if (tags.length > 0) {
			archive.tags = tags;
		}
	}

	if (metadata.data.source) {
		if (metadata.data.source.site === 'e-hentai' || metadata.data.source.site === 'exhentai') {
			const url = `https://${metadata.data.source.site}/g/${metadata.data.source.gid}/${metadata.data.source.token}`;

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
