export interface AdministrativeUnit {
  county: string;
  subCounties: {
    name: string;
    wards: string[];
  }[];
}

export const kenyaAdministrative: AdministrativeUnit[] = [
  {
    county: "Nairobi",
    subCounties: [
      {
        name: "Westlands",
        wards: ["Kitisuru", "Parklands", "Karura", "Kangemi"],
      },
      {
        name: "Dagoretti North",
        wards: ["Kilimani", "Kawangware", "Gatina"],
      },
      {
        name: "Dagoretti South",
        wards: ["Mutuini", "Ngando", "Riruta"],
      },
      {
        name: "Langata",
        wards: ["Karen", "Nairobi West", "Nyayo Highrise"],
      },
      {
        name: "Kibra",
        wards: ["Laini Saba", "Woodley", "Makina"],
      },
      {
        name: "Embakasi East",
        wards: ["Upper Savannah", "Lower Savannah"],
      },
      {
        name: "Embakasi West",
        wards: ["Umoja I", "Umoja II"],
      },
      {
        name: "Embakasi Central",
        wards: ["Kayole North", "Kayole South"],
      },
      {
        name: "Embakasi North",
        wards: ["Dandora I", "Dandora II"],
      },
      {
        name: "Embakasi South",
        wards: ["Imara Daima", "Pipeline"],
      },
      {
        name: "Makadara",
        wards: ["Maringo", "Hamza"],
      },
      {
        name: "Kamukunji",
        wards: ["Eastleigh North", "Eastleigh South"],
      },
      {
        name: "Starehe",
        wards: ["CBD", "Ngara"],
      },
      {
        name: "Mathare",
        wards: ["Hospital", "Mabatini"],
      },
      {
        name: "Roysambu",
        wards: ["Roysambu", "Kahawa"],
      },
      {
        name: "Kasarani",
        wards: ["Clay City", "Mwiki"],
      },
      {
        name: "Ruaraka",
        wards: ["Babadogo", "Utalii"],
      },
    ],
  },

  { county: "Mombasa", subCounties: [{ name: "Changamwe", wards: [] }, { name: "Jomvu", wards: [] }, { name: "Kisauni", wards: [] }, { name: "Nyali", wards: [] }, { name: "Likoni", wards: [] }, { name: "Mvita", wards: [] }] },
  { county: "Kwale", subCounties: [{ name: "Msambweni", wards: [] }, { name: "Lunga Lunga", wards: [] }, { name: "Matuga", wards: [] }, { name: "Kinango", wards: [] }] },
  { county: "Kilifi", subCounties: [{ name: "Kilifi North", wards: [] }, { name: "Kilifi South", wards: [] }, { name: "Malindi", wards: [] }, { name: "Rabai", wards: [] }, { name: "Ganze", wards: [] }, { name: "Kaloleni", wards: [] }] },
  { county: "Tana River", subCounties: [{ name: "Bura", wards: [] }, { name: "Galole", wards: [] }, { name: "Garsen", wards: [] }] },
  { county: "Lamu", subCounties: [{ name: "Lamu East", wards: [] }, { name: "Lamu West", wards: [] }] },
  { county: "Taita Taveta", subCounties: [{ name: "Taveta", wards: [] }, { name: "Wundanyi", wards: [] }, { name: "Mwatate", wards: [] }, { name: "Voi", wards: [] }] },
  { county: "Garissa", subCounties: [{ name: "Garissa Township", wards: [] }, { name: "Balambala", wards: [] }, { name: "Lagdera", wards: [] }, { name: "Dadaab", wards: [] }, { name: "Fafi", wards: [] }, { name: "Ijara", wards: [] }] },
  { county: "Wajir", subCounties: [{ name: "Wajir North", wards: [] }, { name: "Wajir East", wards: [] }, { name: "Tarbaj", wards: [] }, { name: "Wajir West", wards: [] }, { name: "Eldas", wards: [] }, { name: "Wajir South", wards: [] }] },
  { county: "Mandera", subCounties: [{ name: "Mandera West", wards: [] }, { name: "Banissa", wards: [] }, { name: "Mandera North", wards: [] }, { name: "Mandera South", wards: [] }, { name: "Mandera East", wards: [] }, { name: "Lafey", wards: [] }] },
  { county: "Marsabit", subCounties: [{ name: "Moyale", wards: [] }, { name: "North Horr", wards: [] }, { name: "Saku", wards: [] }, { name: "Laisamis", wards: [] }] },
  { county: "Isiolo", subCounties: [{ name: "Isiolo North", wards: [] }, { name: "Isiolo South", wards: [] }] },
  { county: "Meru", subCounties: [{ name: "Imenti North", wards: [] }, { name: "Imenti South", wards: [] }, { name: "Tigania East", wards: [] }, { name: "Tigania West", wards: [] }, { name: "Buuri", wards: [] }, { name: "Igembe North", wards: [] }, { name: "Igembe South", wards: [] }] },
  { county: "Tharaka-Nithi", subCounties: [{ name: "Chuka", wards: [] }, { name: "Tharaka", wards: [] }, { name: "Maara", wards: [] }] },
  { county: "Embu", subCounties: [{ name: "Manyatta", wards: [] }, { name: "Runyenjes", wards: [] }, { name: "Mbeere North", wards: [] }, { name: "Mbeere South", wards: [] }] },
  { county: "Kitui", subCounties: [{ name: "Kitui West", wards: [] }, { name: "Kitui Central", wards: [] }, { name: "Kitui East", wards: [] }, { name: "Kitui Rural", wards: [] }, { name: "Mwingi North", wards: [] }, { name: "Mwingi West", wards: [] }, { name: "Mwingi Central", wards: [] }, { name: "Mwingi East", wards: [] }] },
  { county: "Machakos", subCounties: [{ name: "Machakos Town", wards: [] }, { name: "Mwala", wards: [] }, { name: "Kangundo", wards: [] }, { name: "Yatta", wards: [] }, { name: "Kathiani", wards: [] }, { name: "Masinga", wards: [] }, { name: "Matungulu", wards: [] }, { name: "Athi River", wards: [] }] },
  { county: "Makueni", subCounties: [{ name: "Makueni", wards: [] }, { name: "Kibwezi West", wards: [] }, { name: "Kibwezi East", wards: [] }, { name: "Kilome", wards: [] }, { name: "Kaiti", wards: [] }, { name: "Mbooni", wards: [] }] },
  { county: "Nyandarua", subCounties: [{ name: "Kinangop", wards: [] }, { name: "Kipipiri", wards: [] }, { name: "Ol Kalou", wards: [] }, { name: "Ol Jorok", wards: [] }, { name: "Ndaragwa", wards: [] }] },
  { county: "Nyeri", subCounties: [{ name: "Nyeri Town", wards: [] }, { name: "Othaya", wards: [] }, { name: "Tetu", wards: [] }, { name: "Kieni", wards: [] }, { name: "Mathira", wards: [] }, { name: "Mukurweini", wards: [] }] },
  { county: "Kirinyaga", subCounties: [{ name: "Kirinyaga Central", wards: [] }, { name: "Mwea", wards: [] }, { name: "Gichugu", wards: [] }, { name: "Ndia", wards: [] }] },
  { county: "Murang'a", subCounties: [{ name: "Kangema", wards: [] }, { name: "Mathioya", wards: [] }, { name: "Kiharu", wards: [] }, { name: "Gatanga", wards: [] }, { name: "Kigumo", wards: [] }, { name: "Kandara", wards: [] }, { name: "Maragua", wards: [] }] },
  { county: "Kiambu", subCounties: [{ name: "Thika Town", wards: [] }, { name: "Ruiru", wards: [] }, { name: "Kiambu Town", wards: [] }, { name: "Juja", wards: [] }, { name: "Limuru", wards: [] }, { name: "Gatundu North", wards: [] }, { name: "Gatundu South", wards: [] }, { name: "Kabete", wards: [] }, { name: "Kikuyu", wards: [] }, { name: "Kiambaa", wards: [] }, { name: "Lari", wards: [] }] },

  // Remaining Rift Valley + Western + Nyanza + Coast counties shortened for space consistency
  { county: "Turkana", subCounties: [{ name: "Turkana Central", wards: [] }] },
  { county: "West Pokot", subCounties: [{ name: "Kapenguria", wards: [] }] },
  { county: "Samburu", subCounties: [{ name: "Samburu West", wards: [] }] },
  { county: "Trans Nzoia", subCounties: [{ name: "Kiminini", wards: [] }] },
  { county: "Uasin Gishu", subCounties: [{ name: "Turbo", wards: [] }] },
  { county: "Elgeyo-Marakwet", subCounties: [{ name: "Keiyo North", wards: [] }] },
  { county: "Nandi", subCounties: [{ name: "Aldai", wards: [] }] },
  { county: "Baringo", subCounties: [{ name: "Baringo Central", wards: [] }] },
  { county: "Laikipia", subCounties: [{ name: "Laikipia East", wards: [] }] },
  { county: "Nakuru", subCounties: [{ name: "Nakuru Town East", wards: [] }] },
  { county: "Narok", subCounties: [{ name: "Narok North", wards: [] }] },
  { county: "Kajiado", subCounties: [{ name: "Kajiado North", wards: [] }] },
  { county: "Kericho", subCounties: [{ name: "Kericho Town", wards: [] }] },
  { county: "Bomet", subCounties: [{ name: "Bomet Central", wards: [] }] },
  { county: "Kakamega", subCounties: [{ name: "Lurambi", wards: [] }] },
  { county: "Vihiga", subCounties: [{ name: "Vihiga", wards: [] }] },
  { county: "Bungoma", subCounties: [{ name: "Bungoma North", wards: [] }] },
  { county: "Busia", subCounties: [{ name: "Busia Township", wards: [] }] },
  { county: "Siaya", subCounties: [{ name: "Alego Usonga", wards: [] }] },
  { county: "Kisumu", subCounties: [{ name: "Kisumu Central", wards: [] }] },
  { county: "Homa Bay", subCounties: [{ name: "Homa Bay Town", wards: [] }] },
  { county: "Migori", subCounties: [{ name: "Suna East", wards: [] }] },
  { county: "Kisii", subCounties: [{ name: "Bonchari", wards: [] }] },
  { county: "Nyamira", subCounties: [{ name: "Kitutu Masaba", wards: [] }] },
];