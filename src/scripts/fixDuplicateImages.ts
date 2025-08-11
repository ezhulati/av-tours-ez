
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
)

function parseJsonArray(value: any): any[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

async function removeDuplicates() {
  const toursToFix = [
  {
    "id": "70c7e300-91c3-42a9-9d13-493c930b7084",
    "slug": "10-days-guided-peaks-balkans-2025",
    "title": "10 Days Guided - Peaks of the Balkans 2025",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/20180721_143222-1-1024x576-2.jpg",
        "count": 2,
        "filename": "20180721_143222-1-1024x576-2.jpg"
      }
    ]
  },
  {
    "id": "8f3a2fc8-8169-4460-a2ac-01bf5c8cbb72",
    "slug": "10-days-self-guided-peaks-balkans",
    "title": "10 Days Self-Guided Peaks of the Balkans",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/11/20230622_105400-scaled.jpg",
        "count": 2,
        "filename": "20230622_105400-scaled.jpg"
      }
    ]
  },
  {
    "id": "6c77787a-4fd7-44cf-bef6-e0daeec357a3",
    "slug": "5-cultural-days-kosovo",
    "title": "5 Cultural Days in Kosovo",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/Kulla_e_Osdautajve_Isniq-1024x476-1.jpg",
        "count": 2,
        "filename": "Kulla_e_Osdautajve_Isniq-1024x476-1.jpg"
      }
    ]
  },
  {
    "id": "0b63c567-812e-451e-8c43-f0347638a3a4",
    "slug": "5-days-biking-peaks-balkans",
    "title": "5 Days Biking Through Peaks of the Balkans",
    "totalImages": 6,
    "uniqueImages": 5,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/20210704_130848-01-1348x476-min.jpeg",
        "count": 2,
        "filename": "20210704_130848-01-1348x476-min.jpeg"
      }
    ]
  },
  {
    "id": "aa008a7e-3bfa-495c-8993-87762dce66a1",
    "slug": "6-days-guided-peaks-balkans-2025",
    "title": "6 Days Guided - Peaks of the Balkans 2025",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2024/10/DSCF9726-scaled.jpg",
        "count": 2,
        "filename": "DSCF9726-scaled.jpg"
      }
    ]
  },
  {
    "id": "87244915-1106-45d7-8363-61d2beb663fc",
    "slug": "6-days-self-guided-peaks-balkans",
    "title": "6 Days Self-Guided Peaks of the Balkans",
    "totalImages": 6,
    "uniqueImages": 5,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/11/20230918_145206-scaled.jpg",
        "count": 2,
        "filename": "20230918_145206-scaled.jpg"
      }
    ]
  },
  {
    "id": "e5aa6949-15a5-4f3f-bdf9-a734994a686b",
    "slug": "weekend-peaks-balkans-section",
    "title": "A Weekend in Peaks of the Balkans Section",
    "totalImages": 3,
    "uniqueImages": 2,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/87-KenSpence_-1-1348x476-1.jpg",
        "count": 2,
        "filename": "87-KenSpence_-1-1348x476-1.jpg"
      }
    ]
  },
  {
    "id": "408807bb-5e08-4d25-9823-9808c1a89ff6",
    "slug": "albania-kosovo-10-days",
    "title": "Albania and Kosovo in 10 Days",
    "totalImages": 11,
    "uniqueImages": 10,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/cultutral-tour-photos15-scaled-e1603112450243-1348x476-min.jpg",
        "count": 2,
        "filename": "cultutral-tour-photos15-scaled-e1603112450243-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "6b8f01de-fb46-44b9-8c5b-274e246141b7",
    "slug": "albania-kosovo-8-days",
    "title": "Albania and Kosovo in 8 Days",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/Rozafa-Castle-Shkodra-1348x476-1.jpeg",
        "count": 2,
        "filename": "Rozafa-Castle-Shkodra-1348x476-1.jpeg"
      }
    ]
  },
  {
    "id": "1df26364-72fa-4608-833f-c43a0e546d83",
    "slug": "albania-bird-watching-cultural",
    "title": "Albania Bird Watching and Cultural Tour",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/Karavasta-1-1348x476-min.jpg",
        "count": 2,
        "filename": "Karavasta-1-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "482dd1e6-0126-4d19-9469-b9bf7bbe6e88",
    "slug": "border-crossing-permits",
    "title": "Border Crossing Permits",
    "totalImages": 3,
    "uniqueImages": 2,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/BNA_2101-e1602233727187-1348x476-min.jpg",
        "count": 2,
        "filename": "BNA_2101-e1602233727187-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "64e74e0f-190d-4025-92c8-ae8809c74131",
    "slug": "climbing-zla-kollata",
    "title": "Climbing Zla Kollata",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/View-from-Kollata-Peak-scaled-e1637588560888-1348x476-min.jpg",
        "count": 2,
        "filename": "View-from-Kollata-Peak-scaled-e1637588560888-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "564c82c9-6298-4a91-ae5a-bcc8bedd71a6",
    "slug": "cultural-weekend-albania",
    "title": "Cultural Weekend in Albania",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/Onufri-Museum-Berat-1-1348x476-min.jpg",
        "count": 2,
        "filename": "Onufri-Museum-Berat-1-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "85e9b111-2800-404a-88e1-ace882979ef7",
    "slug": "downhill-biking",
    "title": "Downhill Biking",
    "totalImages": 8,
    "uniqueImages": 7,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/biking-960x476-min.jpg",
        "count": 2,
        "filename": "biking-960x476-min.jpg"
      }
    ]
  },
  {
    "id": "e59ac8dc-d270-4a82-9a5c-815e10d95236",
    "slug": "e-biking-peaks-of-balkans",
    "title": "E-biking in Peaks of the Balkans",
    "totalImages": 11,
    "uniqueImages": 10,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2025/04/DSC04170-819x1024.jpg",
        "count": 2,
        "filename": "DSC04170-819x1024.jpg"
      }
    ]
  },
  {
    "id": "8b15268f-be99-47b2-a381-5d502c105870",
    "slug": "gjeravica-kosovo-highest",
    "title": "Gjeravica - Kosovo's Highest",
    "totalImages": 9,
    "uniqueImages": 8,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/gjeravica-top-1100x476-1-min.jpg",
        "count": 2,
        "filename": "gjeravica-top-1100x476-1-min.jpg"
      }
    ]
  },
  {
    "id": "4424058d-06d3-4750-afd8-d7f49bc43eb9",
    "slug": "great-canyon-cave",
    "title": "Great Canyon Cave",
    "totalImages": 3,
    "uniqueImages": 2,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/IMG_1641_1-1348x476-1.jpg",
        "count": 2,
        "filename": "IMG_1641_1-1348x476-1.jpg"
      }
    ]
  },
  {
    "id": "c3605c2f-f166-4c08-bd52-40344d49e5a5",
    "slug": "guided-high-scardus-2025",
    "title": "Guided - High Scardus 2025",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2024/01/hs1-scaled.jpg",
        "count": 2,
        "filename": "hs1-scaled.jpg"
      }
    ]
  },
  {
    "id": "477dde26-a6b4-4abc-876a-20b8ccc5bac2",
    "slug": "guided-self-guided-hiking-albania",
    "title": "Guided and Self-Guided Hiking Tours Albania",
    "totalImages": 5,
    "uniqueImages": 4,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/BNA_2291-01-e1601902669970-min.jpeg",
        "count": 2,
        "filename": "BNA_2291-01-e1601902669970-min.jpeg"
      }
    ]
  },
  {
    "id": "5fa0829c-8d23-46b5-bb52-ab50f01aed6b",
    "slug": "high-scardus-trail",
    "title": "High Scardus Trail",
    "totalImages": 3,
    "uniqueImages": 2,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/20230801_170835-scaled.jpg",
        "count": 2,
        "filename": "20230801_170835-scaled.jpg"
      }
    ]
  },
  {
    "id": "0850455c-4c13-49f2-ba0f-496dd43c25cf",
    "slug": "highest-peaks-4-countries",
    "title": "Highest Peaks of 4 Countries",
    "totalImages": 5,
    "uniqueImages": 4,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/2I6A7056-1-1348x476-min.jpg",
        "count": 2,
        "filename": "2I6A7056-1-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "355ccd3a-51e9-44e3-b456-6376ab05c37d",
    "slug": "hike-hajla-peak",
    "title": "Hike the Hajla Peak",
    "totalImages": 8,
    "uniqueImages": 7,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/54146_orig.jpg",
        "count": 2,
        "filename": "54146_orig.jpg"
      }
    ]
  },
  {
    "id": "dab7c123-c972-49b5-8ecc-c4841ca6f235",
    "slug": "hiking-archery-kosovo",
    "title": "Hiking and Archery in Kosovo",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/20180424_141443-1348x476-1.jpg",
        "count": 2,
        "filename": "20180424_141443-1348x476-1.jpg"
      }
    ]
  },
  {
    "id": "f61ed2d5-d753-4b30-896a-cd515ff594cf",
    "slug": "hiking-kosovo-overview",
    "title": "Hiking in Kosovo - Overview",
    "totalImages": 11,
    "uniqueImages": 10,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/adriatik-top-white-1348x476-min.jpg",
        "count": 2,
        "filename": "adriatik-top-white-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "b9790c1a-1e33-4ff0-b610-85c6c70803b9",
    "slug": "lake-liqenat-swim-border",
    "title": "Hiking in Lake Liqenat - Swim Across the Border",
    "totalImages": 7,
    "uniqueImages": 6,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/liqeni-liqunatit-kufini-1348x476-min.jpg",
        "count": 2,
        "filename": "liqeni-liqunatit-kufini-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "f22551b2-e74c-4975-b62b-54d37736cd4c",
    "slug": "hiking-rugova-mountains",
    "title": "Hiking in Rugova Mountains",
    "totalImages": 8,
    "uniqueImages": 7,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/DSC_0115-2-1348x476-1-min.jpg",
        "count": 2,
        "filename": "DSC_0115-2-1348x476-1-min.jpg"
      }
    ]
  },
  {
    "id": "0dda5c55-fd87-4637-97c1-7e45ee175ce0",
    "slug": "hiking-sharr-mountains",
    "title": "Hiking in Sharr Mountains",
    "totalImages": 10,
    "uniqueImages": 9,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/1-sharr19.jpg",
        "count": 2,
        "filename": "1-sharr19.jpg"
      }
    ]
  },
  {
    "id": "96065037-7b01-4c86-88ad-da0f7050a6ae",
    "slug": "kosovo-cultural-sites-one-week",
    "title": "Kosovo Cultural Sites in One Week",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/Prizren-7-1348x476-min.jpg",
        "count": 2,
        "filename": "Prizren-7-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "7c595fd6-7714-4151-8403-77f79f24d9a3",
    "slug": "kosovo-daily-excursions",
    "title": "Kosovo Daily Excursions",
    "totalImages": 3,
    "uniqueImages": 2,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/Kosovo-cultural_074-1348x476-min.jpg",
        "count": 2,
        "filename": "Kosovo-cultural_074-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "f12f841d-e922-42dd-a27a-ff5de24c6eba",
    "slug": "kosovo-guide-petit-fute",
    "title": "Kosovo Guide - Petit Futé",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/10/2-KenSpence_-1348x476-min.jpg",
        "count": 2,
        "filename": "2-KenSpence_-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "fff7c8bf-0a5b-44bc-aace-245204e85c1b",
    "slug": "maja-arapit-albanian-matterhorn",
    "title": "Maja Arapit - The Albanian Matterhorn",
    "totalImages": 3,
    "uniqueImages": 2,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/maja-arapit-tyti-1348x476-min.jpg",
        "count": 2,
        "filename": "maja-arapit-tyti-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "2f989c54-2f4f-4ab1-9ee6-8674ee75ab6d",
    "slug": "maja-rosit-2533m",
    "title": "Maja e Rosit (Rosin Vrh) - 2533m",
    "totalImages": 9,
    "uniqueImages": 8,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/2018-06-01_12-19-58-min-1348x476-min.jpg",
        "count": 2,
        "filename": "2018-06-01_12-19-58-min-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "33665eab-1fbc-454a-b663-1f36c0198f1a",
    "slug": "maja-jezerce-three-countries",
    "title": "Maja Jezerce - Climb from Three Countries",
    "totalImages": 7,
    "uniqueImages": 6,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/jezerc-candy-960x476-min.jpg",
        "count": 2,
        "filename": "jezerc-candy-960x476-min.jpg"
      }
    ]
  },
  {
    "id": "0de1bf13-9c86-4571-8e32-cca52b1b3d07",
    "slug": "northern-kosovo-political-tour",
    "title": "Northern Kosovo Political Tour",
    "totalImages": 3,
    "uniqueImages": 2,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/kosovo-cult44-1348x476-1.jpg",
        "count": 2,
        "filename": "kosovo-cult44-1348x476-1.jpg"
      }
    ]
  },
  {
    "id": "4e14d5b6-1be9-4196-972e-089f26ea3c4d",
    "slug": "paragliding-above-peja",
    "title": "Paragliding Above Peja",
    "totalImages": 8,
    "uniqueImages": 7,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/01-1348x476-1.jpg",
        "count": 2,
        "filename": "01-1348x476-1.jpg"
      }
    ]
  },
  {
    "id": "c7df6f15-0920-4ee4-af78-5f2d3245c919",
    "slug": "peaks-balkans-booking",
    "title": "Peaks of the Balkans Booking",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/9-1348x476-1.jpg",
        "count": 2,
        "filename": "9-1348x476-1.jpg"
      }
    ]
  },
  {
    "id": "7e756633-ece3-4409-b38f-3d04b2165873",
    "slug": "peja-kosovo-destination",
    "title": "Peja Kosovo - Destination Guide",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/Peja-2-min.jpg",
        "count": 2,
        "filename": "Peja-2-min.jpg"
      }
    ]
  },
  {
    "id": "9cafbeb1-1eba-4c73-8305-5de596571344",
    "slug": "prishtina-cultural-tour",
    "title": "Prishtina Cultural Tour",
    "totalImages": 5,
    "uniqueImages": 4,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/20190913_111829-min-scaled.jpg",
        "count": 2,
        "filename": "20190913_111829-min-scaled.jpg"
      }
    ]
  },
  {
    "id": "2d32abc2-017b-437c-abdf-b3a89eef4767",
    "slug": "prizren-kosovo",
    "title": "Prizren Kosovo",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/Prizreni-1-min.jpg",
        "count": 2,
        "filename": "Prizreni-1-min.jpg"
      }
    ]
  },
  {
    "id": "6e1d487d-4a62-4ab5-ad18-44c3fc48a533",
    "slug": "rock-climbing",
    "title": "Rock Climbing",
    "totalImages": 8,
    "uniqueImages": 7,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/danish5-768x476-1.jpg",
        "count": 2,
        "filename": "danish5-768x476-1.jpg"
      }
    ]
  },
  {
    "id": "36cbe2fe-d9e3-4f35-99e2-cd2a1d8f8e9c",
    "slug": "shkodra-one-day-city-visit",
    "title": "Shkodra One Day City Visit",
    "totalImages": 3,
    "uniqueImages": 2,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/shkodra-1348x476-min.jpg",
        "count": 2,
        "filename": "shkodra-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "427946c9-929f-4ac5-b4bd-baa042900620",
    "slug": "short-break-accursed-mountains",
    "title": "Short Break in the Accursed Mountains",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/fidan2-960x476-1.jpg",
        "count": 2,
        "filename": "fidan2-960x476-1.jpg"
      }
    ]
  },
  {
    "id": "b339c0d7-c148-4eae-a475-4937d4a8eff2",
    "slug": "ski-sport-balkans",
    "title": "Ski Sport in the Balkans",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/gacaferi6-scaled-1348x476-1-min.jpg",
        "count": 2,
        "filename": "gacaferi6-scaled-1348x476-1-min.jpg"
      }
    ]
  },
  {
    "id": "73e4f481-1c70-43dd-833c-1be372c849b6",
    "slug": "ski-touring-kosovo-albania",
    "title": "Ski Touring in Kosovo and Albania",
    "totalImages": 8,
    "uniqueImages": 7,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/20220114_091753-1348x476-1.jpg",
        "count": 2,
        "filename": "20220114_091753-1348x476-1.jpg"
      }
    ]
  },
  {
    "id": "0584f2e7-1a86-4b0d-8858-c10c85e28393",
    "slug": "snowshoeing-kosovo",
    "title": "Snowshoeing in Kosovo",
    "totalImages": 8,
    "uniqueImages": 7,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/20190209_142555-01-1348x476-min.jpeg",
        "count": 2,
        "filename": "20190209_142555-01-1348x476-min.jpeg"
      }
    ]
  },
  {
    "id": "a9053325-7ee1-45a9-a014-92308b99bd0c",
    "slug": "theth-albania-destination",
    "title": "Theth Albania - Destination Guide",
    "totalImages": 6,
    "uniqueImages": 5,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/Theth-82-KenSpence_-753x448-min.jpg",
        "count": 2,
        "filename": "Theth-82-KenSpence_-753x448-min.jpg"
      }
    ]
  },
  {
    "id": "302c7f08-64ce-4ab7-9c91-4998f7b52c36",
    "slug": "unesco-albania-heritage-weekend-2",
    "title": "UNESCO Albania Heritage Weekend",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2024/04/kosovi-skitour-SSchoepf-53.jpg",
        "count": 2,
        "filename": "kosovi-skitour-SSchoepf-53.jpg"
      }
    ]
  },
  {
    "id": "9cf57408-e9a4-4c0b-9a50-70d75ce42f03",
    "slug": "unesco-albania-weekend",
    "title": "UNESCO Albania Weekend",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/IMG_0030-1348x476-1.jpg",
        "count": 2,
        "filename": "IMG_0030-1348x476-1.jpg"
      }
    ]
  },
  {
    "id": "1eeab54d-6fcc-4356-a881-e42f49c07479",
    "slug": "unesco-kosovo-weekend",
    "title": "UNESCO Kosovo Weekend",
    "totalImages": 5,
    "uniqueImages": 4,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/kosovo-cult41-1348x476-min.jpg",
        "count": 2,
        "filename": "kosovo-cult41-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "4c625f17-57f5-48ba-8df5-df4b85870732",
    "slug": "via-ferrata-groups-weekends",
    "title": "Via Ferrata in Groups - Weekends",
    "totalImages": 3,
    "uniqueImages": 2,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/na1-1348x476-1.jpg",
        "count": 2,
        "filename": "na1-1348x476-1.jpg"
      }
    ]
  },
  {
    "id": "2df185a1-c9b8-4653-80bf-17c895da2f44",
    "slug": "via-ferrata-marimangat",
    "title": "Via Ferrata Marimangat",
    "totalImages": 11,
    "uniqueImages": 10,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/11/DB__8182-1-scaled.jpg",
        "count": 2,
        "filename": "DB__8182-1-scaled.jpg"
      }
    ]
  },
  {
    "id": "806871d9-930f-4d40-a99a-283fb797b703",
    "slug": "via-ferrata-mat-ari",
    "title": "Via Ferrata Mat and Ari",
    "totalImages": 11,
    "uniqueImages": 10,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/10/Via-Ferrata-Mat-1-1-scaled.jpg",
        "count": 2,
        "filename": "Via-Ferrata-Mat-1-1-scaled.jpg"
      }
    ]
  },
  {
    "id": "0cad44b9-fa3c-43e7-9f4e-4dd08ec881d3",
    "slug": "via-ferrata-shpellat-caves",
    "title": "Via Ferrata Shpellat (Caves)",
    "totalImages": 11,
    "uniqueImages": 10,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/11/DB__8436-1-scaled.jpg",
        "count": 2,
        "filename": "DB__8436-1-scaled.jpg"
      }
    ]
  },
  {
    "id": "fb9125fe-ff74-4b29-9417-71f390370c3e",
    "slug": "weekend-cultural-wine-tasting",
    "title": "Weekend Cultural Tour and Wine Tasting",
    "totalImages": 4,
    "uniqueImages": 3,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/patrikana-1037x476-1.jpg",
        "count": 2,
        "filename": "patrikana-1037x476-1.jpg"
      }
    ]
  },
  {
    "id": "2aab61bb-9dcc-4c4c-9a21-e3e99e8c7f5e",
    "slug": "weekend-in-valbona",
    "title": "Weekend in Valbona",
    "totalImages": 10,
    "uniqueImages": 9,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/IMG_1404-1024x476-1-min.jpg",
        "count": 2,
        "filename": "IMG_1404-1024x476-1-min.jpg"
      }
    ]
  },
  {
    "id": "4ceca912-9246-4716-b994-bda5bf60df8e",
    "slug": "weekend-prishtina-western-kosovo",
    "title": "Weekend Trip to Prishtina and Western Kosovo",
    "totalImages": 11,
    "uniqueImages": 10,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/20191020_115215-1348x476-min.jpg",
        "count": 2,
        "filename": "20191020_115215-1348x476-min.jpg"
      }
    ]
  },
  {
    "id": "54daa709-0e5a-4ea6-96d6-6fb8daf26483",
    "slug": "wildlife-tour-accursed-mountains",
    "title": "Wildlife Tour in Accursed Mountains",
    "totalImages": 3,
    "uniqueImages": 2,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/rupicapra2-1280x476-1.jpg",
        "count": 2,
        "filename": "rupicapra2-1280x476-1.jpg"
      }
    ]
  },
  {
    "id": "6d93d126-27a1-4f23-ac5f-bc386e7409fe",
    "slug": "zagori-valley-albania-hike",
    "title": "Zagori Valley Albania Hike",
    "totalImages": 7,
    "uniqueImages": 6,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/Photo-122-1348x476-1.jpg",
        "count": 2,
        "filename": "Photo-122-1348x476-1.jpg"
      }
    ]
  },
  {
    "id": "f15c389b-430c-4ea0-9c60-21ec2dc3d9c2",
    "slug": "zip-line-kosovo",
    "title": "Zip Line Kosovo",
    "totalImages": 3,
    "uniqueImages": 2,
    "duplicates": [
      {
        "url": "https://bnadventure.com/wp-content/uploads/2023/09/zip-line-f1-1348x476-1.jpeg",
        "count": 2,
        "filename": "zip-line-f1-1348x476-1.jpeg"
      }
    ]
  }
]
  
  for (const tour of toursToFix) {
    console.log(`\nFixing ${tour.title}...`)
    
    // Fetch current tour data
    const { data, error } = await supabase
      .from('affiliate_tours')
      .select('primary_image, image_gallery')
      .eq('id', tour.id)
      .single()
    
    if (error || !data) {
      console.error(`Error fetching tour ${tour.slug}:`, error)
      continue
    }
    
    // Parse current gallery
    const currentGallery = parseJsonArray(data.image_gallery)
    console.log(`  Current gallery: ${currentGallery.length} images`)
    
    // Remove duplicates from gallery
    const seen = new Set<string>()
    const uniqueGallery: string[] = []
    
    // Track primary image to avoid duplicates
    if (data.primary_image) {
      seen.add(data.primary_image)
    }
    
    // Filter gallery for unique images
    currentGallery.forEach((img: string) => {
      // Normalize the URL for comparison
      const normalizedUrl = img.replace(/^\/+/, '').replace(/^https?:\/\/[^\/]+/, '')
      const fullUrl = img.startsWith('http') ? img : img
      
      // Check if we've seen this image
      let isDuplicate = false
      for (const seenUrl of seen) {
        const normalizedSeen = seenUrl.replace(/^\/+/, '').replace(/^https?:\/\/[^\/]+/, '')
        if (normalizedUrl === normalizedSeen || fullUrl === seenUrl) {
          isDuplicate = true
          break
        }
      }
      
      if (!isDuplicate) {
        uniqueGallery.push(img)
        seen.add(fullUrl)
      } else {
        console.log(`  Removing duplicate: ${img.split('/').pop()}`)
      }
    })
    
    console.log(`  New gallery: ${uniqueGallery.length} images`)
    
    // Update tour with unique gallery
    const { error: updateError } = await supabase
      .from('affiliate_tours')
      .update({ image_gallery: uniqueGallery })
      .eq('id', tour.id)
    
    if (updateError) {
      console.error(`Error updating tour ${tour.slug}:`, updateError)
    } else {
      console.log(`✅ Fixed ${tour.slug}: ${currentGallery.length} -> ${uniqueGallery.length} gallery images`)
    }
  }
}

removeDuplicates()
  .then(() => console.log('\n✨ Done! All duplicate images have been removed.'))
  .catch(console.error)
