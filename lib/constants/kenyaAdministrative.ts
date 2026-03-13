export interface AdministrativeUnit {
  county: string;
  subCounties: {
    name: string;
    wards:
      | string[]
      | {
          name: string;
          areas: string[];
        }[];
  }[];
}

export const kenyaAdministrative: AdministrativeUnit[] = [
 {
  county: "Nairobi",
  subCounties: [

    {
      name: "Westlands",
      wards: [
        {
          name: "Kitisuru",
          areas: ["Kitisuru", "New Kitisuru"]
        },
        {
          name: "Parklands/Highridge",
          areas: ["Parklands", "Highridge", "City Park"]
        },
        {
          name: "Karura",
          areas: ["Peponi", "Spring Valley"]
        },
        {
          name: "Kangemi",
          areas: ["Kangemi", "Mountain View"]
        },
        {
          name: "Mountain View",
          areas: ["Mountain View", "Kipande"]
        }
      ]
    },

    {
      name: "Dagoretti North",
      wards: [
        {
          name: "Kilimani",
          areas: ["Kilimani", "Yaya", "Hurlingham"]
        },
        {
          name: "Kawangware",
          areas: ["Kawangware", "Stage 2", "Stage 56"]
        },
        {
          name: "Gatina",
          areas: ["Gatina"]
        },
        {
          name: "Kileleshwa",
          areas: ["Kileleshwa"]
        },
        {
          name: "Kabiro",
          areas: ["Kabiro"]
        }
      ]
    },

    {
      name: "Dagoretti South",
      wards: [
        {
          name: "Mutuini",
          areas: ["Mutuini"]
        },
        {
          name: "Ngando",
          areas: ["Ngando"]
        },
        {
          name: "Riruta",
          areas: ["Riruta", "Satellite"]
        },
        {
          name: "Uthiru/Ruthimitu",
          areas: ["Uthiru", "Ruthimitu"]
        },
        {
          name: "Waithaka",
          areas: ["Waithaka"]
        }
      ]
    },

    {
      name: "Langata",
      wards: [
        {
          name: "Karen",
          areas: ["Karen", "Hardy", "Bogani"]
        },
        {
          name: "Nairobi West",
          areas: ["Nairobi West"]
        },
        {
          name: "Mugumoini",
          areas: ["Mugumoini"]
        },
        {
          name: "South C",
          areas: ["South C"]
        },
        {
          name: "Nyayo Highrise",
          areas: ["Nyayo Highrise", "Highrise"]
        }
      ]
    },

    {
      name: "Kibra",
      wards: [
        {
          name: "Laini Saba",
          areas: ["Laini Saba"]
        },
        {
          name: "Lindi",
          areas: ["Lindi"]
        },
        {
          name: "Makina",
          areas: ["Makina"]
        },
        {
          name: "Woodley/Kenyatta Golf Course",
          areas: ["Woodley"]
        },
        {
          name: "Sarangombe",
          areas: ["Sarangombe"]
        }
      ]
    },

    {
      name: "Roysambu",
      wards: [
        {
          name: "Roysambu",
          areas: ["Roysambu"]
        },
        {
          name: "Zimmerman",
          areas: ["Zimmerman"]
        },
        {
          name: "Kahawa",
          areas: ["Kahawa"]
        },
        {
          name: "Kahawa West",
          areas: ["Kahawa West"]
        },
        {
          name: "Githurai",
          areas: ["Githurai 44"]
        }
      ]
    },

    {
      name: "Kasarani",
      wards: [
        {
          name: "Clay City",
          areas: ["Clay City"]
        },
        {
          name: "Mwiki",
          areas: ["Mwiki"]
        },
        {
          name: "Kasarani",
          areas: ["Kasarani"]
        },
        {
          name: "Njiru",
          areas: ["Njiru"]
        },
        {
          name: "Ruai",
          areas: ["Ruai"]
        }
      ]
    },

    {
      name: "Ruaraka",
      wards: [
        {
          name: "Babadogo",
          areas: ["Baba Dogo"]
        },
        {
          name: "Utalii",
          areas: ["Utalii", "Garden Estate"]
        },
        {
          name: "Mathare North",
          areas: ["Mathare North"]
        },
        {
          name: "Lucky Summer",
          areas: ["Lucky Summer"]
        },
        {
          name: "Korogocho",
          areas: ["Korogocho"]
        }
      ]
    },

    {
      name: "Embakasi West",
      wards: [
        {
          name: "Umoja I",
          areas: ["Buruburu", "Jericho"]
        },
        {
          name: "Umoja II",
          areas: ["Umoja", "Tena"]
        },
        {
          name: "Mowlem",
          areas: ["Mowlem"]
        },
        {
          name: "Kariobangi South",
          areas: ["Kariobangi South"]
        }
      ]
    },

    {
      name: "Embakasi East",
      wards: [
        {
          name: "Upper Savannah",
          areas: ["Savannah"]
        },
        {
          name: "Lower Savannah",
          areas: ["Donholm"]
        },
        {
          name: "Embakasi",
          areas: ["Embakasi"]
        },
        {
          name: "Utawala",
          areas: ["Utawala"]
        },
        {
          name: "Mihango",
          areas: ["Mihango"]
        }
      ]
    },

    {
      name: "Embakasi South",
      wards: [
        {
          name: "Imara Daima",
          areas: ["Imara Daima"]
        },
        {
          name: "Kwa Njenga",
          areas: ["Kwa Njenga"]
        },
        {
          name: "Kwa Reuben",
          areas: ["Kwa Reuben"]
        },
        {
          name: "Pipeline",
          areas: ["Pipeline"]
        },
        {
          name: "Kware",
          areas: ["Kware"]
        }
      ]
    },

    {
      name: "Embakasi North",
      wards: [
        {
          name: "Dandora I",
          areas: ["Dandora Phase 1"]
        },
        {
          name: "Dandora II",
          areas: ["Dandora Phase 2"]
        },
        {
          name: "Dandora III",
          areas: ["Dandora Phase 3"]
        },
        {
          name: "Dandora IV",
          areas: ["Dandora Phase 4"]
        }
      ]
    },

    {
      name: "Embakasi Central",
      wards: [
        {
          name: "Kayole North",
          areas: ["Kayole North"]
        },
        {
          name: "Kayole Central",
          areas: ["Kayole Central"]
        },
        {
          name: "Kayole South",
          areas: ["Kayole South"]
        },
        {
          name: "Komarock",
          areas: ["Komarock"]
        },
        {
          name: "Matopeni",
          areas: ["Matopeni"]
        }
      ]
    },

    {
      name: "Makadara",
      wards: [
        {
          name: "Maringo/Hamza",
          areas: ["Maringo", "Hamza"]
        },
        {
          name: "Viwandani",
          areas: ["Viwandani"]
        },
        {
          name: "Harambee",
          areas: ["Harambee"]
        },
        {
          name: "Makongeni",
          areas: ["Makongeni"]
        }
      ]
    },

    {
      name: "Kamukunji",
      wards: [
        {
          name: "Pumwani",
          areas: ["Pumwani"]
        },
        {
          name: "Eastleigh North",
          areas: ["Eastleigh Section 1"]
        },
        {
          name: "Eastleigh South",
          areas: ["Eastleigh Section 2"]
        },
        {
          name: "Airbase",
          areas: ["Airbase"]
        },
        {
          name: "California",
          areas: ["California"]
        }
      ]
    },

    {
      name: "Starehe",
      wards: [
        {
          name: "Nairobi Central",
          areas: ["CBD"]
        },
        {
          name: "Ngara",
          areas: ["Ngara"]
        },
        {
          name: "Pangani",
          areas: ["Pangani"]
        },
        {
          name: "Landimawe",
          areas: ["Landimawe"]
        },
        {
          name: "Nairobi South",
          areas: ["South B"]
        }
      ]
    },

    {
      name: "Mathare",
      wards: [
        {
          name: "Hospital",
          areas: ["Mathare Hospital"]
        },
        {
          name: "Mabatini",
          areas: ["Mabatini"]
        },
        {
          name: "Huruma",
          areas: ["Huruma"]
        },
        {
          name: "Ngei",
          areas: ["Ngei"]
        },
        {
          name: "Mlango Kubwa",
          areas: ["Mlango Kubwa"]
        },
        {
          name: "Kiamaiko",
          areas: ["Kiamaiko"]
        }
      ]
    }

  ]
},
  {
  county: "Mombasa",
  subCounties: [
    {
      name: "Changamwe",
      wards: ["Port Reitz", "Kipevu", "Airport", "Changamwe", "Chaani"]
    },
    {
      name: "Jomvu",
      wards: ["Jomvu Kuu", "Miritini", "Mikindani"]
    },
    {
      name: "Kisauni",
      wards: ["Mjambere", "Junda", "Bamburi", "Mwakirunge", "Mtopanga", "Magogoni", "Shanzu"]
    },
    {
      name: "Nyali",
      wards: ["Frere Town", "Ziwa La Ng'ombe", "Kadzandani", "Kongowea", "Kijipwa"]
    },
    {
      name: "Likoni",
      wards: ["Mtongwe", "Shika Adabu", "Bofu", "Likoni", "Timbwani"]
    },
    {
      name: "Mvita",
      wards: ["Mji Wa Kale/Makadara", "Tudor", "Tononoka", "Shimanzi/Ganjoni", "Majengo"]
    }
  ]
},
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
 {
  county: "Machakos",
  subCounties: [
    {
      name: "Masinga",
      wards: ["Kivaa", "Masinga Central", "Ekalakala", "Muthesya", "Ndithini"]
    },
    {
      name: "Yatta",
      wards: ["Ndalani", "Matuu", "Kithimani", "Ikombe", "Katangi"]
    },
    {
      name: "Kangundo",
      wards: ["Kangundo North", "Kangundo Central", "Kangundo East", "Kangundo West"]
    },
    {
      name: "Matungulu",
      wards: ["Tala", "Matungulu North", "Matungulu East", "Matungulu West", "Kyeleni"]
    },
    {
      name: "Kathiani",
      wards: ["Mitaboni", "Kathiani Central", "Upper Kaewa/Iveti", "Lower Kaewa/Kaani"]
    },
    {
      name: "Mavoko",
      wards: ["Athi River", "Kinanie", "Muthwani", "Syokimau/Mulolongo"]
    },
    {
      name: "Machakos Town",
      wards: ["Kalama", "Mua", "Mutituni", "Machakos Central", "Mumbuni North", "Muvuti/Kiima Kimwe", "Kola"]
    },
    {
      name: "Mwala",
      wards: ["Mbiuni", "Makutano/Mwala", "Masii", "Muthetheni", "Wamunyu", "Kibauni"]
    }
  ]
},
  { county: "Makueni", subCounties: [{ name: "Makueni", wards: [] }, { name: "Kibwezi West", wards: [] }, { name: "Kibwezi East", wards: [] }, { name: "Kilome", wards: [] }, { name: "Kaiti", wards: [] }, { name: "Mbooni", wards: [] }] },
  { county: "Nyandarua", subCounties: [{ name: "Kinangop", wards: [] }, { name: "Kipipiri", wards: [] }, { name: "Ol Kalou", wards: [] }, { name: "Ol Jorok", wards: [] }, { name: "Ndaragwa", wards: [] }] },
 {
  county: "Nyeri",
  subCounties: [
    {
      name: "Tetu",
      wards: ["Dedan Kimathi", "Wamagana", "Aguthi/Gaaki"]
    },
    {
      name: "Kieni",
      wards: ["Mweiga", "Naromoru Kiamathaga", "Mwiyogo/Endarasha", "Mugunda", "Gatarakwa", "Thegu River"]
    },
    {
      name: "Mathira",
      wards: ["Ruguru", "Magutu", "Iriaini", "Konyu", "Kirimukuyu", "Karatina Town"]
    },
    {
      name: "Othaya",
      wards: ["Mahiga", "Iria-Ini", "Chinga", "Karima"]
    },
    {
      name: "Mukurweini",
      wards: ["Gikondi", "Rugi", "Mukurweini West", "Mukurweini Central"]
    },
    {
      name: "Nyeri Town",
      wards: ["Kiganjo/Mathari", "Rware", "Gatitu/Muruguru", "Ruring'u", "Kamakwa/Mukaro"]
    }
  ]
},
  { county: "Kirinyaga", subCounties: [{ name: "Kirinyaga Central", wards: [] }, { name: "Mwea", wards: [] }, { name: "Gichugu", wards: [] }, { name: "Ndia", wards: [] }] },
  {
  county: "Murang'a",
  subCounties: [
    {
      name: "Kangema",
      wards: ["Kanyenya-ini", "Muguru", "Rwathia"]
    },
    {
      name: "Mathioya",
      wards: ["Gitugi", "Kiru", "Kamacharia"]
    },
    {
      name: "Kiharu",
      wards: ["Wangu", "Mugoiri", "Mbiri", "Township", "Murarandia", "Gaturi"]
    },
    {
      name: "Kigumo",
      wards: ["Kahumbu", "Muthithi", "Kigumo", "Kangari", "Kinyona"]
    },
    {
      name: "Maragua",
      wards: ["Kimorori/Wempa", "Makuyu", "Kambiti", "Kamahuha", "Ichagaki", "Nginda"]
    },
    {
      name: "Kandara",
      wards: ["Ng'araria", "Muruka", "Kagundu-ini", "Gaichanjiru", "Ithiru", "Ruchu"]
    },
    {
      name: "Gatanga",
      wards: ["Ithanga", "Kakuzi/Mitubiri", "Mugumo-ini", "Kihumbu-ini", "Gatanga", "Kariara"]
    }
  ]
},
 {
  county: "Kiambu",
  subCounties: [

    {
      name: "Gatundu South",
      wards: [
        {
          name: "Kiamwangi",
          areas: ["Kiamwangi", "Gatundu Town"]
        },
        {
          name: "Kiganjo",
          areas: ["Kiganjo"]
        },
        {
          name: "Ndarugu",
          areas: ["Ndarugu", "Ndarugu Market"]
        },
        {
          name: "Ngenda",
          areas: ["Ngenda", "Gachika"]
        }
      ]
    },

    {
      name: "Gatundu North",
      wards: [
        {
          name: "Gituamba",
          areas: ["Gituamba"]
        },
        {
          name: "Githobokoni",
          areas: ["Githobokoni"]
        },
        {
          name: "Chania",
          areas: ["Chania", "Chania Town"]
        },
        {
          name: "Mang'u",
          areas: ["Mang'u", "Mang'u High School Area"]
        }
      ]
    },

    {
      name: "Juja",
      wards: [
        {
          name: "Murera",
          areas: ["Murera"]
        },
        {
          name: "Theta",
          areas: ["Theta", "Kalimoni"]
        },
        {
          name: "Juja",
          areas: ["Juja Town", "JKUAT", "Gachororo"]
        },
        {
          name: "Witeithie",
          areas: ["Witeithie", "Mastore"]
        },
        {
          name: "Kalimoni",
          areas: ["Kalimoni"]
        }
      ]
    },

    {
      name: "Thika Town",
      wards: [
        {
          name: "Township",
          areas: ["Thika CBD", "Makongeni"]
        },
        {
          name: "Kamenu",
          areas: ["Kamenu"]
        },
        {
          name: "Hospital",
          areas: ["Thika Hospital Area"]
        },
        {
          name: "Gatuanyaga",
          areas: ["Gatuanyaga"]
        },
        {
          name: "Ngoliba",
          areas: ["Ngoliba"]
        }
      ]
    },

    {
      name: "Ruiru",
      wards: [
        {
          name: "Gitothua",
          areas: ["Gitothua"]
        },
        {
          name: "Biashara",
          areas: ["Ruiru Town", "Ruiru CBD"]
        },
        {
          name: "Gatongora",
          areas: ["Gatongora"]
        },
        {
          name: "Kahawa Sukari",
          areas: ["Kahawa Sukari"]
        },
        {
          name: "Kahawa Wendani",
          areas: ["Kahawa Wendani"]
        },
        {
          name: "Kiuu",
          areas: ["Kiuu"]
        },
        {
          name: "Mwihoko",
          areas: ["Mwihoko"]
        }
      ]
    },

    {
      name: "Githunguri",
      wards: [
        {
          name: "Githunguri",
          areas: ["Githunguri Town"]
        },
        {
          name: "Githiga",
          areas: ["Githiga"]
        },
        {
          name: "Ikinu",
          areas: ["Ikinu"]
        },
        {
          name: "Ngewa",
          areas: ["Ngewa"]
        },
        {
          name: "Komothai",
          areas: ["Komothai"]
        }
      ]
    },

    {
      name: "Kiambu",
      wards: [
        {
          name: "Ting'ang'a",
          areas: ["Ting'ang'a"]
        },
        {
          name: "Ndumberi",
          areas: ["Ndumberi"]
        },
        {
          name: "Riabai",
          areas: ["Riabai"]
        },
        {
          name: "Township",
          areas: ["Kiambu Town", "Kiambu CBD"]
        }
      ]
    },

    {
      name: "Kiambaa",
      wards: [
        {
          name: "Cianda",
          areas: ["Cianda"]
        },
        {
          name: "Karuri",
          areas: ["Karuri Town"]
        },
        {
          name: "Ndenderu",
          areas: ["Ndenderu"]
        },
        {
          name: "Muchatha",
          areas: ["Muchatha"]
        },
        {
          name: "Kihara",
          areas: ["Kihara"]
        }
      ]
    },

    {
      name: "Kabete",
      wards: [
        {
          name: "Gitaru",
          areas: ["Gitaru"]
        },
        {
          name: "Muguga",
          areas: ["Muguga"]
        },
        {
          name: "Nyathuna",
          areas: ["Nyathuna"]
        },
        {
          name: "Kabete",
          areas: ["Lower Kabete", "Upper Kabete"]
        },
        {
          name: "Uthiru",
          areas: ["Uthiru"]
        }
      ]
    },

    {
      name: "Kikuyu",
      wards: [
        {
          name: "Karai",
          areas: ["Karai"]
        },
        {
          name: "Nachu",
          areas: ["Nachu"]
        },
        {
          name: "Sigona",
          areas: ["Sigona"]
        },
        {
          name: "Kikuyu",
          areas: ["Kikuyu Town"]
        },
        {
          name: "Kinoo",
          areas: ["Kinoo", "87 Area"]
        }
      ]
    },

    {
      name: "Limuru",
      wards: [
        {
          name: "Bibirioni",
          areas: ["Bibirioni"]
        },
        {
          name: "Limuru Central",
          areas: ["Limuru Town"]
        },
        {
          name: "Ndeiya",
          areas: ["Ndeiya"]
        },
        {
          name: "Limuru East",
          areas: ["Limuru East"]
        },
        {
          name: "Ngecha/Tigoni",
          areas: ["Tigoni", "Ngecha"]
        }
      ]
    },

    {
      name: "Lari",
      wards: [
        {
          name: "Kinale",
          areas: ["Kinale"]
        },
        {
          name: "Kijabe",
          areas: ["Kijabe"]
        },
        {
          name: "Nyanduma",
          areas: ["Nyanduma"]
        },
        {
          name: "Kamburu",
          areas: ["Kamburu"]
        },
        {
          name: "Lari/Kirenga",
          areas: ["Lari", "Kirenga"]
        }
      ]
    }

  ]
},

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
 {
  county: "Nakuru",
  subCounties: [
    {
      name: "Naivasha",
      wards: ["Biashara", "Hells Gate", "Lake View", "Mai Mahiu", "Maiella", "Olkaria", "Naivasha East", "Viwandani"]
    },
    {
      name: "Nakuru Town West",
      wards: ["Barut", "London", "Kaptembwo", "Rhoda", "Shaabab"]
    },
    {
      name: "Nakuru Town East",
      wards: ["Biashara", "Kivumbini", "Flamingo", "Menengai", "Nakuru East"]
    },
    {
      name: "Subukia",
      wards: ["Subukia", "Waseges", "Kabazi"]
    },
    {
      name: "Rongai",
      wards: ["Menengai West", "Soin", "Visoi", "Mosop", "Solai"]
    },
    {
      name: "Bahati",
      wards: ["Dundori", "Kabatini", "Kiamaina", "Lanet/Umoja", "Bahati"]
    },
    {
      name: "Kuresoi South",
      wards: ["Amalo", "Keringet", "Kiptagich", "Tinet"]
    },
    {
      name: "Kuresoi North",
      wards: ["Kiptororo", "Nyota", "Sirikwa", "Kamara"]
    },
    {
      name: "Molo",
      wards: ["Mariashoni", "Elburgon", "Turi", "Molo"]
    },
    {
      name: "Njoro",
      wards: ["Mau Narok", "Mauche", "Kihingo", "Nessuit", "Lare", "Njoro"]
    },
    {
      name: "Gilgil",
      wards: ["Gilgil", "Elementaita", "Mbaruk/Eburu", "Malewa West", "Murindat"]
    }
  ]
},
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
