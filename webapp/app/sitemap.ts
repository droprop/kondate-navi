export const dynamic = 'force-static'
import { MetadataRoute } from 'next'
import { SITE_URL } from './site'
import { getAvailableMonths } from './lib/archive'

export default function sitemap(): MetadataRoute.Sitemap {
  const months = getAvailableMonths()
  const now = new Date()

  const archiveEntries: MetadataRoute.Sitemap = months.map((m, idx) => ({
    url: `${SITE_URL}/archive/${m.ym}`,
    lastModified: now,
    changeFrequency: idx <= 1 ? 'weekly' : 'monthly',
    priority: idx <= 1 ? 0.8 : 0.7,
  }))

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/archive`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...archiveEntries,
  ]
}
