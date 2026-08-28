import { Service, CatalogItem, Brand, PriceItem, Category, Subcategory, RawProduct } from "./types";
import rawProductsData from "./products.json";
import rawCategoriesData from "./categories.json";

const RAW_SUBCATEGORIES: Subcategory[] = rawCategoriesData as Subcategory[];
export const ALL_SUBCATEGORIES_SLUG = "all";

/**
 * "Краны, вентили, задвижки и клапаны" в categories.json — одна подкатегория,
 * хотя товары внутри неё физически разного типа. Здесь разбиваем её на 4
 * виртуальные подкатегории (без правки JSON) — распределение товаров по ним
 * происходит по ключевому слову в названии товара, см. detectVirtualSubcatId().
 */
interface SplitRule {
  keyword: string;
  id: string;
  name: string;
  slug: string;
}

const SPLIT_CONFIG: Record<string, SplitRule[]> = {
  "cat_plumbing_krany-ventili-zadvizhki-i-klapany": [
    { keyword: "задвиж", id: "cat_plumbing_zadvizhki", name: "Задвижки", slug: "zadvizhki" },
    { keyword: "клапан", id: "cat_plumbing_klapany", name: "Клапаны", slug: "klapany" },
    { keyword: "вентил", id: "cat_plumbing_ventili", name: "Вентили", slug: "ventili" },
  ],
  "cat_plumbing_fitingi-chugunnye-i-latunnye-mufty-troyniki-u": [
    { keyword: "прокладк", id: "cat_plumbing_fit_prokladki", name: "Прокладки", slug: "fitingi-prokladki" },
    { keyword: "соединит", id: "cat_plumbing_fit_soediniteli", name: "Соединители разборные", slug: "fitingi-soediniteli" },
    { keyword: "контргайк", id: "cat_plumbing_fit_kontrgayki", name: "Контргайки", slug: "fitingi-kontrgayki" },
    { keyword: "крестовин", id: "cat_plumbing_fit_krestoviny", name: "Крестовины", slug: "fitingi-krestoviny" },
    { keyword: "муфт", id: "cat_plumbing_fit_mufty", name: "Муфты", slug: "fitingi-mufty" },
    { keyword: "ниппел", id: "cat_plumbing_fit_nippeli", name: "Ниппели", slug: "fitingi-nippeli" },
    { keyword: "переход", id: "cat_plumbing_fit_perehody", name: "Переходы", slug: "fitingi-perehody" },
    { keyword: "тройник", id: "cat_plumbing_fit_troyniki", name: "Тройники", slug: "fitingi-troyniki" },
    { keyword: "угольник", id: "cat_plumbing_fit_ugolniki", name: "Угольники", slug: "fitingi-ugolniki" },
    { keyword: "футорк", id: "cat_plumbing_fit_futorki", name: "Футорки", slug: "fitingi-futorki" },
    { keyword: "штуцер", id: "cat_plumbing_fit_shtucery", name: "Штуцеры", slug: "fitingi-shtucery" },
  ],
  "cat_plumbing_truby-stalnye-pe-pvh-i-stalnye-soedinitelnye": [
    { keyword: "бочат", id: "cat_plumbing_truby_bochata", name: "Бочата", slug: "truby-bochata" },
    { keyword: "отвод", id: "cat_plumbing_truby_otvody", name: "Отводы", slug: "truby-otvody" },
    { keyword: "переход", id: "cat_plumbing_truby_perehody", name: "Переходы", slug: "truby-perehody" },
    { keyword: "резьб", id: "cat_plumbing_truby_rezby", name: "Резьбы", slug: "truby-rezby" },
    { keyword: "сгон", id: "cat_plumbing_truby_sgony", name: "Сгоны", slug: "truby-sgony" },
    { keyword: "тройник", id: "cat_plumbing_truby_troyniki", name: "Тройники", slug: "truby-troyniki" },
    { keyword: "муфт", id: "cat_plumbing_truby_mufty", name: "Муфты", slug: "truby-mufty" },
    { keyword: "труб", id: "cat_plumbing_truby_truby", name: "Трубы", slug: "truby-truby" },
  ],
};

function buildVirtualSubcategoryId(sourceCategoryId: string, productName: string): string {
  const rules = SPLIT_CONFIG[sourceCategoryId];
  if (!rules) return sourceCategoryId;
  const n = productName.toLowerCase();
  for (const rule of rules) {
    if (n.includes(rule.keyword)) return rule.id;
  }
  return sourceCategoryId;
}

const VIRTUAL_SUBCATEGORIES: Subcategory[] = Object.values(SPLIT_CONFIG).flatMap((rules) =>
  rules.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    image: null,
    seo: { title: null, description: null, h1: r.name },
  }))
);

export const ALL_SUBCATEGORIES: Subcategory[] = [
  ...RAW_SUBCATEGORIES.filter((s) => !SPLIT_CONFIG[s.id]),
  ...VIRTUAL_SUBCATEGORIES,
];

/**
 * Явная карта "id подкатегории -> название категории" для тех случаев, когда
 * угадывание по ключевым словам (inferCategoryFromName) даёт неверный результат
 * или неоднозначно (например "Станция управления" содержит "станция", что раньше
 * ошибочно уводило в "Насосное оборудование"). Проверяется ПЕРЕД inferCategoryFromName.
 */
const SUBCATEGORY_CATEGORY_OVERRIDE: Record<string, string> = {
  "cat_electrika_kabelno-provodnikovaya-produkciya": "Кабельно-проводниковая продукция",
  "cat_electrika_sistemy-prokladki-kabelya": "Системы прокладки кабеля",
  "cat_electrika_nizkovoltnoe-oborudovanie": "Низковольтное оборудование",
  "cat_electrika_svetotehnika": "Светотехника",
  "cat_electrika_elektromontazhnye-izdeliya": "Электромонтажные изделия",
  "cat_electrika_shkafy-i-boksy": "Шкафы и боксы",
  "cat_pumps_ustroystvo-upravleniya-i-zaschity": "Автоматика и защита насосов",
  "cat_pumps_stanciya-upravleniya": "Автоматика и защита насосов",
  "cat_electrika_magazin-elektrika-lampa-nakalivaniya": "Светотехника",
  "cat_electrika_magazin-elektrika-narodnaya": "Светотехника",
  "cat_electrika_magazin-elektrika-navigator": "Светотехника",
  "cat_electrika_magazin-elektrika-e14": "Светотехника",
  "cat_electrika_magazin-elektrika-e27": "Светотехника",
  "cat_electrika_magazin-elektrika-osram": "Светотехника",
  "cat_electrika_magazin-elektrika-e27-1": "Светотехника",
  "cat_electrika_magazin-elektrika-e14-1": "Светотехника",
  "cat_electrika_magazin-elektrika-general": "Светотехника",
  "cat_electrika_magazin-elektrika-e27-2": "Светотехника",
  "cat_electrika_magazin-elektrika-e14-2": "Светотехника",
  "cat_electrika_magazin-elektrika-general-electric": "Светотехника",
  "cat_electrika_magazin-elektrika-gx53": "Светотехника",
  "cat_electrika_magazin-elektrika-onlayt": "Светотехника",
  "cat_electrika_magazin-elektrika-jazzway": "Светотехника",
  "cat_electrika_magazin-elektrika-gx53-1": "Светотехника",
  "cat_electrika_magazin-elektrika-e27-3": "Светотехника",
  "cat_electrika_magazin-elektrika-e14-3": "Светотехника",
  "cat_electrika_magazin-elektrika-g9": "Светотехника",
  "cat_electrika_magazin-elektrika-gu10": "Светотехника",
  "cat_electrika_magazin-elektrika-wolta": "Светотехника",
  "cat_electrika_magazin-elektrika-e27-4": "Светотехника",
  "cat_electrika_magazin-elektrika-e14-4": "Светотехника",
  "cat_electrika_magazin-elektrika-smartbuy": "Светотехника",
  "cat_electrika_magazin-elektrika-e27-5": "Светотехника",
  "cat_electrika_magazin-elektrika-e14-5": "Светотехника",
  "cat_electrika_magazin-elektrika-gu5-3": "Светотехника",
  "cat_electrika_magazin-elektrika-era": "Светотехника",
  "cat_electrika_magazin-elektrika-feron": "Светотехника",
  "cat_electrika_magazin-elektrika-lampa-ikzk-250w-220v-e27-dlya-obogreva": "Светотехника",
  "cat_electrika_magazin-elektrika-lampa-t8-g13-23": "Светотехника",
  "cat_electrika_magazin-elektrika-1-2m": "Светотехника",
  "cat_electrika_magazin-elektrika-0-6m": "Светотехника",
  "cat_electrika_magazin-elektrika-patron-keramika-karbolit-perehodnik": "Светотехника",
  "cat_electrika_magazin-elektrika-patron-gu5-3-dlya-galogennyh-lamp-ekf": "Светотехника",
  "cat_electrika_magazin-elektrika-vilka": "Светотехника",
  "cat_electrika_magazin-elektrika-nakonechnik": "Светотехника",
  "cat_electrika_magazin-elektrika-alyuminiy": "Светотехника",
  "cat_electrika_magazin-elektrika-nakonechnik-kabelnyy-boltovoy": "Светотехника",
  "cat_electrika_magazin-elektrika-alyuminiy-1": "Светотехника",
  "cat_electrika_magazin-elektrika-soedinitel-gilza-kabelnyy-boltovoy": "Светотехника",
  "cat_electrika_magazin-elektrika-lenta-svetodiodnaya": "Светотехника",
  "cat_electrika_magazin-elektrika-gotovyy-komplekt": "Светотехника",
  "cat_electrika_magazin-elektrika-drayver": "Светотехника",
  "cat_electrika_magazin-elektrika-homut-neylonovyy-dlya-kabelya": "Светотехника",
  "cat_electrika_magazin-elektrika-homut-lipuchka-20-mm-5m-roll-chernyy-ekf-proxima-hlft-2-b-strana-proish-kitay": "Светотехника",
  "cat_electrika_magazin-elektrika-zazhim-prokalyvayuschiy-otvetvit": "Светотехника",
  "cat_electrika_magazin-elektrika-birka-markirovochnaya": "Светотехника",
  "cat_electrika_magazin-elektrika-shina-soedenitelnaya-tipa-pin-shtyr": "Светотехника",
  "cat_electrika_magazin-elektrika-potolochnyy-anker": "Светотехника",
  "cat_electrika_magazin-elektrika-izolenta": "Светотехника",
  "cat_electrika_magazin-elektrika-izolenta-hb": "Светотехника",
  "cat_electrika_magazin-elektrika-din-reyka": "Светотехника",
  "cat_electrika_magazin-elektrika-shina-m1t": "Светотехника",
  "cat_electrika_magazin-elektrika-datchik-dvizheniya": "Светотехника",
  "cat_electrika_magazin-elektrika-vyklyuchatel-vsh-beltiz": "Светотехника",
  "cat_electrika_magazin-elektrika-plavkaya-vstavka": "Светотехника",
  "cat_electrika_magazin-elektrika-plavkaya-vstavka-rt28-32-20a-10h38-cilindricheska": "Светотехника",
  "cat_electrika_magazin-elektrika-vstavka-plavkaya-npn2-60": "Светотехника",
  "cat_electrika_magazin-elektrika-vilka-shtepselnaya": "Светотехника",
  "cat_electrika_magazin-elektrika-stabilizator-napryazheniya-nastennyy": "Светотехника",
  "cat_electrika_magazin-elektrika-termousadochnaya-trubka": "Светотехника",
  "cat_electrika_magazin-elektrika-kleevaya": "Светотехника",
  "cat_electrika_magazin-elektrika-nabor-5-cvetov-krasnyy-zheltyy-zelenyy-siniy-belyy-po-2-sht": "Светотехника",
  "cat_electrika_magazin-elektrika-termousadka-s-pripoem-i-kleevym-sloem": "Светотехника",
  "cat_electrika_magazin-elektrika-nakleyka": "Светотехника",
  "cat_electrika_magazin-elektrika-klemmnik-vintovoy": "Светотехника",
  "cat_electrika_magazin-elektrika-klemmnik-nabornyy-zni": "Светотехника",
  "cat_electrika_magazin-elektrika-soedinitelnaya-klemma": "Светотехника",
  "cat_electrika_magazin-elektrika-salnik": "Светотехника",
  "cat_electrika_magazin-elektrika-perchatka-termousazhivaemaya": "Светотехника",
  "cat_electrika_magazin-elektrika-tros-metallopolimernyy": "Светотехника",
  "cat_electrika_magazin-elektrika-v-pvh": "Светотехника",
  "cat_electrika_magazin-elektrika-stalnoy": "Светотехника",
  "cat_electrika_magazin-elektrika-ogranichitel-na-din-reyku": "Светотехника",
  "cat_electrika_magazin-elektrika-izolyator-uglovoy": "Светотехника",
  "cat_electrika_magazin-elektrika-shina-na-din-reyku-v-korpuse": "Светотехника",
  "cat_electrika_magazin-elektrika-izolyator-sm60-m8-silovoy-bochonok": "Светотехника",
  "cat_electrika_magazin-elektrika-klemnyy-terminal": "Светотехника",
  "cat_electrika_magazin-elektrika-rele-elektroteplovoe": "Светотехника",
  "cat_electrika_magazin-elektrika-udlinitnel": "Светотехника",
  "cat_electrika_magazin-elektrika-zvonok": "Светотехника",
  "cat_electrika_magazin-elektrika-sverlo-po-beton": "Светотехника",
  "cat_electrika_magazin-elektrika-sverlo-po-metallu": "Светотехника",
  "cat_electrika_magazin-elektrika-sverlo-po-metallu-po-10sht-v-tubuse": "Светотехника",
  "cat_electrika_magazin-elektrika-sverlo-po-derevu": "Светотехника",
  "cat_electrika_magazin-elektrika-udlinitel-dlya-vintovyh-sverl": "Светотехника",
  "cat_electrika_magazin-elektrika-krug-almaznyy-po-betonu": "Светотехника",
  "cat_electrika_magazin-elektrika-kraska": "Светотехника",
  "cat_electrika_magazin-elektrika-tumbler-p2t5": "Светотехника",
  "cat_electrika_magazin-elektrika-setevoy-filtr": "Светотехника",
  "cat_electrika_magazin-elektrika-krug-otreznoy-krug-lepestkovyy-torcevoy": "Светотехника",
  "cat_electrika_magazin-elektrika-homut-chervyachnyy": "Светотехника",
  "cat_electrika_magazin-elektrika-sverlilnyy-patron": "Светотехника",
  "cat_electrika_magazin-elektrika-homut-zazemleniya-uhz": "Светотехника",
  "cat_electrika_magazin-elektrika-batareyka": "Светотехника",
  "cat_electrika_magazin-elektrika-aaa-mezinchik": "Светотехника",
  "cat_electrika_magazin-elektrika-aa-palchik": "Светотехника",
  "cat_electrika_magazin-elektrika-akkumulyator": "Светотехника",
  "cat_electrika_magazin-elektrika-zaryadnoe-ustroystvo": "Светотехника",
  "cat_electrika_magazin-elektrika-krona": "Светотехника",
  "cat_electrika_magazin-elektrika-litievye-tabletochnye-el-pitaniya": "Светотехника",
  "cat_electrika_magazin-elektrika-zima": "Светотехника",
  "cat_electrika_svetilnik-prozhektor-fonarik-svetilnik-lineynyy": "Светотехника",
  "cat_electrika_svetilnik-prozhektor-fonarik-svetilnik-zhkh-01-krug": "Светотехника",
  "cat_electrika_svetilnik-prozhektor-fonarik-svetilnik-vstraivaemyy": "Светотехника",
  "cat_electrika_svetilnik-prozhektor-fonarik-svetilnik-dlya-bani": "Светотехника",
  "cat_electrika_svetilnik-prozhektor-fonarik-svetilnik-perenosnoy-iek-era": "Светотехника",
  "cat_electrika_svetilnik-prozhektor-fonarik-svetilnik-nastenno-potolochnyy": "Светотехника",
  "cat_electrika_svetilnik-prozhektor-fonarik-bra": "Светотехника",
  "cat_electrika_svetilnik-prozhektor-fonarik-prozhektor": "Светотехника",
  "cat_electrika_svetilnik-prozhektor-fonarik-navigator": "Светотехника",
  "cat_electrika_svetilnik-prozhektor-fonarik-jazzway": "Светотехника",
  "cat_electrika_svetilnik-prozhektor-fonarik-svetilnik-svetodiodnyy-konsolnyy": "Светотехника",
  "cat_electrika_kabel-provod-provd-pvsn": "Кабельно-проводниковая продукция",
  "cat_electrika_kabel-provod-kabel-vvg-med": "Кабельно-проводниковая продукция",
  "cat_electrika_kabel-provod-provod-pugv-pv-3": "Кабельно-проводниковая продукция",
  "cat_electrika_kabel-provod-provod-puv-pv-1": "Кабельно-проводниковая продукция",
  "cat_electrika_kabel-provod-shnur-patch-kord": "Кабельно-проводниковая продукция",
  "cat_electrika_kabel-provod-provod-sip-4": "Кабельно-проводниковая продукция",
  "cat_electrika_kabel-provod-teplyy-pol": "Кабельно-проводниковая продукция",
  "cat_electrika_mufta-kabelnaya-obschee": "Кабельно-проводниковая продукция",
  "cat_electrika_mufta-kabelnaya-mufta-koncevaya": "Кабельно-проводниковая продукция",
  "cat_electrika_mufta-kabelnaya-koncevaya-vnutrenney-ustanovki-na-napryazhenie-do-1-kv-dlya-kabelya-s-plastmassovoy-izolyaciey-i-broney-kolichestvo-zhil-4-sechenie-zhil-35-50-s-boltovymi-nakonechnikami": "Кабельно-проводниковая продукция",
  "cat_electrika_mufta-kabelnaya-mufta-soedenitelnaya": "Кабельно-проводниковая продукция",
  "cat_electrika_mufta-kabelnaya-soedinitelnaya-na-napryazhenie-do-1-kv-dlya-kabelya-s-plastmassovoy-izolyaciey-i-broney-kolichestvo-zhil-4-sechenie-zhil-16-25-s-boltovymi-soedinitelyami": "Кабельно-проводниковая продукция",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-gofra-truba": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-rukav-metallicheskiy": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-krepezh-klipsa-dlya-truby": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-krepezh-klipsa-dlya-truby-s-fiksatorom": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-skoba-metallicheskaya-odnolap": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-skoba-dvuhlapkovaya": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-akssesuary-dlya-kabel-kanala": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-kabel-kanal": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-lotok-kryshka": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-perforirovannyy": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-neperforirovannyy": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-komplekt-soedinitelnyy": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-kronshteyn-nastenn": "Системы прокладки кабеля",
  "cat_electrika_kabel-kanal-gofra-rukav-krepezh-skoba-ploskaya-plastikovaya": "Системы прокладки кабеля",
  "cat_electrika_avtomatika-predohranitel": "Низковольтное оборудование",
  "cat_electrika_avtomatika-avtomaticheskiy-vyklyuchatel": "Низковольтное оборудование",
  "cat_electrika_avtomatika-1r-legrand-era": "Низковольтное оборудование",
  "cat_electrika_avtomatika-tm-legrand": "Низковольтное оборудование",
  "cat_electrika_avtomatika-era": "Низковольтное оборудование",
  "cat_electrika_avtomatika-iek-iek": "Низковольтное оборудование",
  "cat_electrika_avtomatika-h-ka-b": "Низковольтное оборудование",
  "cat_electrika_avtomatika-1r-shcet": "Низковольтное оборудование",
  "cat_electrika_avtomatika-h-ka-b-1": "Низковольтное оборудование",
  "cat_electrika_avtomatika-h-ka-d": "Низковольтное оборудование",
  "cat_electrika_avtomatika-2r-legrand-era-chint": "Низковольтное оборудование",
  "cat_electrika_avtomatika-h-ka-b-2": "Низковольтное оборудование",
  "cat_electrika_avtomatika-2r-shcet": "Низковольтное оборудование",
  "cat_electrika_avtomatika-3r-legrand-era-chint": "Низковольтное оборудование",
  "cat_electrika_avtomatika-avt-vykl-nxb-63s-3p-32a-4-5ka-h-ka-c-chint-kitay": "Низковольтное оборудование",
  "cat_electrika_avtomatika-gabarit-100": "Низковольтное оборудование",
  "cat_electrika_avtomatika-gabarit-225": "Низковольтное оборудование",
  "cat_electrika_avtomatika-h-ka-b-3": "Низковольтное оборудование",
  "cat_electrika_avtomatika-3r-shcet": "Низковольтное оборудование",
  "cat_electrika_avtomatika-h-ka-b-4": "Низковольтное оборудование",
  "cat_electrika_avtomatika-h-ka-d-1": "Низковольтное оборудование",
  "cat_electrika_avtomatika-3r-tdm": "Низковольтное оборудование",
  "cat_electrika_avtomatika-differencialnyy-avtomat": "Низковольтное оборудование",
  "cat_electrika_avtomatika-10ma": "Низковольтное оборудование",
  "cat_electrika_avtomatika-30ma": "Низковольтное оборудование",
  "cat_electrika_avtomatika-tm-legrand-1": "Низковольтное оборудование",
  "cat_electrika_avtomatika-era-1": "Низковольтное оборудование",
  "cat_electrika_avtomatika-10ma-1": "Низковольтное оборудование",
  "cat_electrika_avtomatika-30ma-1": "Низковольтное оборудование",
  "cat_electrika_avtomatika-3r-n-legrand-era-4p": "Низковольтное оборудование",
  "cat_electrika_avtomatika-vyklyuchatel-nagruzki": "Низковольтное оборудование",
  "cat_electrika_avtomatika-ogranich-impul-perenapr": "Низковольтное оборудование",
  "cat_electrika_avtomatika-uzo-ustroystvo-zaschitnogo-otklyucheniya": "Низковольтное оборудование",
  "cat_electrika_avtomatika-etp": "Низковольтное оборудование",
  "cat_electrika_avtomatika-magnitnye-puskateli": "Низковольтное оборудование",
  "cat_electrika_avtomatika-220v": "Низковольтное оборудование",
  "cat_electrika_avtomatika-380v": "Низковольтное оборудование",
  "cat_electrika_avtomatika-rele-vremeni": "Низковольтное оборудование",
  "cat_electrika_avtomatika-rele-kontrolya-napryazheniya": "Низковольтное оборудование",
  "cat_electrika_avtomatika-rele-kontrolya-faz": "Низковольтное оборудование",
  "cat_electrika_avtomatika-regulyator-temperatury": "Низковольтное оборудование",
  "cat_electrika_avtomatika-rele-kontrolya-urovnya": "Низковольтное оборудование",
  "cat_electrika_avtomatika-avtomat-lestnichnyy": "Низковольтное оборудование",
  "cat_electrika_avtomatika-yaschik-yatp-0-25-yaschik-yarp": "Низковольтное оборудование",
  "cat_electrika_avtomatika-izveschatel-pozharnyy-datchik-ugarnogo-gaza": "Низковольтное оборудование",
  "cat_electrika_avtomatika-rele-teplovoe-rti-3355-30-40a-era-kitay": "Низковольтное оборудование",
  "cat_electrika_avtomatika-rubilniki-pereklyuchateli": "Низковольтное оборудование",
  "cat_electrika_avtomatika-rubilnik-nh40": "Низковольтное оборудование",
  "cat_electrika_avtomatika-rele-promezhutochnoe": "Низковольтное оборудование",
  "cat_electrika_post-knopochnyy-knopka-pereklyuchatel-vyklyuchatel": "Низковольтное оборудование",
  "cat_electrika_post-knopochnyy-post-knopochnyy": "Низковольтное оборудование",
  "cat_electrika_schetchiki-schetchik-aktivnoy-i-reaktivnoy-elektricheskoy": "Низковольтное оборудование",
  "cat_electrika_korobki-montazhnye-korobki-montazhnye": "Электромонтажные изделия",
  "cat_electrika_korobki-montazhnye-gipsokarton": "Электромонтажные изделия",
  "cat_electrika_armatura-polosa-armatura": "Электромонтажные изделия",
  "cat_electrika_armatura-polosa-polosa-shina": "Электромонтажные изделия",
  "cat_electrika_konvektor-ventilyator-obschee": "Электромонтажные изделия",
  "cat_electrika_korpus-schit-korpus-plastikovyy-navesnoy-schrn": "Шкафы и боксы",
  "cat_electrika_korpus-schit-korpus-plastikovyy-vstraivaemyy-schrv": "Шкафы и боксы",
  "cat_electrika_korpus-schit-korpus-metallicheskiy-schrn": "Шкафы и боксы",
  "cat_electrika_korpus-schit-ip31": "Шкафы и боксы",
  "cat_electrika_korpus-schit-ip54": "Шкафы и боксы",
  "cat_electrika_korpus-schit-schmp": "Шкафы и боксы",
  "cat_electrika_korpus-schit-schrv-schurv": "Шкафы и боксы",
  "cat_electrika_vilka-rozetki-vyklyuchateli-bylectrika-beltiz-tdm-ekf": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-rozetka": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-vyklyuchatel": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-vilka-silovaya": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-rozetka-silovaya-stacion": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-rozetka-vilka-silovaya-iz-kauchuka": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-vyklyuchatel-vrite-iek": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-alyuminiy": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-chernyy": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-ramka-vrite-iek": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-alyuminiy-1": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-chernyy-1": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-rozetka-vrite-iek": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-alyuminiy-2": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-chernyy-2": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-belyy": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-rozetka-na-din-reyku": "Розетки и выключатели",
  "cat_electrika_vilka-rozetki-vyklyuchateli-new3-e-chint-kitay": "Розетки и выключатели",
  "cat_electrika_shnayder-kollekciya-atlas-design-obschee": "Розетки и выключатели",
  "cat_electrika_shnayder-kollekciya-atlas-design-naruzhnoy-ustanovki": "Розетки и выключатели",
  "cat_electrika_shnayder-kollekciya-atlas-design-artgallery": "Розетки и выключатели",
  "cat_electrika_beltiz-razvetvitel": "Розетки и выключатели",
  "cat_electrika_beltiz-vyklyuchatel": "Розетки и выключатели",
  "cat_electrika_beltiz-rozetka": "Розетки и выключатели",
  "cat_electrika_beltiz-bez-zazemleniya": "Розетки и выключатели",
  "cat_electrika_beltiz-kryshka": "Розетки и выключатели",
  "cat_electrika_beltiz-blok-vn-ust": "Розетки и выключатели",
  "cat_electrika_beltiz-rozetka-1": "Розетки и выключатели",
  "cat_electrika_beltiz-vyklyuchatel-1": "Розетки и выключатели",
  "cat_electrika_beltiz-blok-naruzhnoy-ust": "Розетки и выключатели",
  "cat_electrika_beltiz-vyklyuchatel-vsh-beltiz": "Розетки и выключатели",
  "cat_electrika_instrument-instrument": "Инструмент",
  "cat_electrika_instrument-perchatki-kovrik-dielektricheskie": "Инструмент",
  "cat_electrika_instrument-payalniki": "Инструмент",
  "cat_electrika_instrument-pripoy-zhir-flyus": "Инструмент",
  "cat_electrika_instrument-ruletka-izmeritelnaya": "Инструмент",
  "cat_electrika_instrument-shtangelcirkul": "Инструмент",
  "cat_electrika_instrument-nabor-bit": "Инструмент",
  "cat_electrika_instrument-lestnica-stremyanka": "Инструмент",
  "cat_electrika_instrument-zazhim-krokodil": "Инструмент",
  "cat_electrika_instrument-pena": "Инструмент",
  "cat_electrika_takelazh-obschee": "Такелаж",
  "cat_electrika_takelazh-zazhim-dlya-trosa-dvoynoy": "Такелаж",
  "cat_electrika_takelazh-zazhim-dlya-trosa-starfix": "Такелаж",
  "cat_electrika_takelazh-talrep-kolco-kolco": "Такелаж",
  "cat_electrika_takelazh-talrep-kryuk-kryuk": "Такелаж",
  "cat_electrika_takelazh-talrep-kryuk-kolco": "Такелаж",
  "cat_electrika_takelazh-anker-bolt-s-kolcom": "Такелаж",
  "cat_electrika_takelazh-anker-bolt-s-kryukom": "Такелаж",
  "cat_electrika_takelazh-skoba-takelazhnaya": "Такелаж",
  "cat_electrika_takelazh-rym-gayka": "Такелаж",
  "cat_electrika_takelazh-rym-bolt": "Такелаж",
  "cat_electrika_takelazh-karabin": "Такелаж",
  "cat_electrika_takelazh-vertlyug": "Такелаж",
};

const SUBCATEGORY_INDEX = new Map<
  string,
  { categoryName: string; subcategoryName: string; subcategorySlug: string }
>();

const SEEN_SLUGS = new Set<string>();

for (const sub of ALL_SUBCATEGORIES) {
  if (SEEN_SLUGS.has(sub.slug)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[catalog] Дублирующийся slug подкатегории: "${sub.slug}" (id: ${sub.id}). ` +
      `Все slug'и подкатегорий должны быть уникальны глобально — иначе ссылки будут вести не туда.`
    );
  }
  SEEN_SLUGS.add(sub.slug);
  SUBCATEGORY_INDEX.set(sub.id, {
    categoryName: SUBCATEGORY_CATEGORY_OVERRIDE[sub.id] || inferCategoryFromName(sub.name),
    subcategoryName: sub.name,
    subcategorySlug: sub.slug,
  });
}

/**
 * Подкатегории с уже вычисленным полем categoryName (та же логика, что и в
 * SUBCATEGORY_INDEX выше) — используется в Catalog.tsx для группировки
 * подкатегорий по категориям в списке (формат как на elos-by.com/catalog).
 */
export const ALL_SUBCATEGORIES_WITH_CATEGORY: (Subcategory & { categoryName: string })[] =
  ALL_SUBCATEGORIES.map((sub) => ({
    ...sub,
    categoryName: SUBCATEGORY_CATEGORY_OVERRIDE[sub.id] || inferCategoryFromName(sub.name),
  }));

  function inferCategoryFromName(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("кабел") || n.includes("провод") || n.includes("шнур")) return "Кабель и провод";
    if (n.includes("светильник") || n.includes("ламп") || n.includes("прожектор") || n.includes("люстр")) return "Светотехника";
    if (n.includes("розетк") || n.includes("выключат") || n.includes("рамк")) return "Выключатели и розетки";
    if (n.includes("автомат") || n.includes("узо") || n.includes("дифавтомат") || n.includes("щит")) return "Модульное оборудование";
    if (n.includes("насос") || n.includes("скважин") || n.includes("станци")) return "Насосное оборудование";
 
    if (n.includes("самор") || n.includes("дюбел") || n.includes("шуруп") || n.includes("анкер") || n.includes("шайб") || n.includes("гайк") || n.includes("болт") || n.includes("шпильк") || n.includes("переходник")) return "Метизы";
    if (n.includes("хомут")) return "Хомуты ремонтные";
    // ВАЖНО: проверки на "фитинг" должны идти раньше проверки на "труб" —
    // иначе "Фитинги и трубы для полиэтилена/полипропилена" (содержит оба слова)
    // всегда перехватывалась бы общим условием "труб" и не попадала в свой блок.
    if (n.includes("фитинг") && (n.includes("чугун") || n.includes("латун"))) return "Фитинги чугунные и латунные";
    if (n.includes("фитинг")) return "Фитинги для полиэтилена/полипропилена";
    if (n.includes("труб") || n.includes("гофр") || n.includes("лоток")) return "Трубы стальные, ПЭ, ПВХ";
  
    if (n.includes("фланц")) return "Фланцы и заглушки";
    if (n.includes("кран") || n.includes("вентил") || n.includes("задвиж") || n.includes("клапан")) return "Краны, вентили, задвижки и клапаны";
    if (n.includes("манометр") || n.includes("термометр") || n.includes("измерит")) return "Измерительные приборы";
    if (n.includes("уплотнит") || n.includes("изоляц") || n.includes("расходн")) return "Уплотнители, изоляция и расходные материалы";
    if (n.includes("люк") || n.includes("обойм") || n.includes("подставк")) return "Люки, обоймы, подставки";
    return "Метизы";
  }

/**
 * Подбор картинки-заглушки по категории/подкатегории/названию товара,
 * пока не проставлены реальные фото (image: null в products.json).
 */
function getFallbackImage(cat: string, name: string): string {
  const c = (cat + " " + name).toLowerCase();
  if (c.includes("насос") || c.includes("скважин")) return "/images/catalog/water_pumps_1784549298159.jpg";
  if (c.includes("хомут") || c.includes("краб")) return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80";
  if (
    c.includes("метиз") || c.includes("крепёж") || c.includes("крепеж") ||
    c.includes("шайб") || c.includes("болт") || c.includes("гайк") ||
    c.includes("шпильк") || c.includes("саморез") || c.includes("дюбель") ||
    c.includes("шуруп") || c.includes("анкер")
  ) return "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80";
  if (
    c.includes("труб") || c.includes("гофр") || c.includes("лоток") ||
    c.includes("арматур") || c.includes("фитинг") || c.includes("задвижка") ||
    c.includes("вентиль") || c.includes("клапан") || c.includes("кран") ||
    c.includes("заглушка") || c.includes("бочат") || c.includes("соединитель") ||
    c.includes("отвод") || c.includes("фланец") || c.includes("манометр") ||
    c.includes("муфта") || c.includes("прокладк")
  ) return "https://images.unsplash.com/photo-1615529162924-f8605388461d?auto=format&fit=crop&w=400&q=80";
  if (
    c.includes("кабель") || c.includes("провод") || c.includes("гофротруб") ||
    c.includes("кабель-канал")
  ) return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80";
  if (
    c.includes("автомат") || c.includes("узо") || c.includes("контактор") ||
    c.includes("реле") || c.includes("низковольт")
  ) return "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=400&q=80";
  if (c.includes("светильник") || c.includes("прожектор") || c.includes("led") || c.includes("лампа"))
    return "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80";
  if (c.includes("щит") || c.includes("шкаф") || c.includes("бокс") || c.includes("вру"))
    return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80";
  return "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&w=400&q=80";
}

/**
 * ВАЖНО: возвращаем "" (пустую строку), а не "По запросу", когда цены нет.
 * Catalog.tsx сам дописывает суффикс " BYN" к любой непустой строке
 * (`itemPrice ? ... + " BYN" : "По запросу"`), поэтому если вернуть здесь
 * готовую строку "По запросу", на экране получится "По запросу BYN".
 * Пустая строка — falsy, поэтому Catalog.tsx корректно покажет "По запросу".
 */
function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "";
  return String(price);
}

/**
 * Основная функция сборки каталога: связывает products.json (categoryIds)
 * с categories.json (id подкатегорий) и отдаёт плоский список PriceItem.
 */
export function getPriceItems(): PriceItem[] {
  const products = rawProductsData as RawProduct[];

  return products.map((item, index) => {
    const name = item.name || `Товар #${index + 1}`;
    let subcatId = item.categoryIds && item.categoryIds[0];
    if (subcatId && SPLIT_CONFIG[subcatId]) {
      subcatId = buildVirtualSubcategoryId(subcatId, name);
    }
    const resolved = subcatId ? SUBCATEGORY_INDEX.get(subcatId) : undefined;

    const categoryName = resolved ? resolved.categoryName : inferCategoryFromName(name);
    const subcategoryName = resolved ? resolved.subcategoryName : "";

    const img = item.image && item.image.trim().length > 5
      ? item.image
      : getFallbackImage(categoryName, name);

    return {
      id: item.id,
      slug: item.slug,
      name,
      unit: "шт",
      price: formatPrice(item.price),
      category: categoryName,
      subcategory: subcategoryName,
      image: img,
      description: "Профессиональное оборудование от ООО «БелТехКомпания».",

      subcategoryId: subcatId,
      brand: item.brand,
      oldPrice: item.oldPrice,
      inStock: item.inStock,
      attributes: item.attributes,
    } as PriceItem;
  });
}

export const PRICE_ITEMS: PriceItem[] = getPriceItems();

/** Товары конкретной подкатегории по её id (например, для страницы подкатегории) */
export function getProductsBySubcategoryId(subcategoryId: string): PriceItem[] {
  return PRICE_ITEMS.filter((p) => p.subcategoryId === subcategoryId);
}

/**
 * Рекомендуемые товары витрины
 */
export const FEATURED_STORE_PRODUCTS: PriceItem[] = [
  { id: "feat_light_1", name: "Светильник светодиодный LED 36W (595х595) Армстронг", unit: "шт", price: "По запросу", category: "Светотехника", subcategory: "Светильники", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80", description: "Офисный и промышленный светодиодный панельный светильник. Энергосбережение и ровный свет." },
  { id: "feat_light_2", name: "Прожектор светодиодный LED 50W IP65 (уличный)", unit: "шт", price: "По запросу", category: "Светотехника", subcategory: "Светильники", image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80", description: "Уличный герметичный светодиодный прожектор для подсветки фасадов, дворов и объектов." },
  { id: "feat_cable_1", name: "Кабель ВВГнг-LS 3х1.5 ГОСТ (для освещения)", unit: "метр", price: "По запросу", category: "Кабель и провод", subcategory: "Кабели силовые (ВВГнг, АВВГ, КГ)", image: "/images/catalog/cables_and_wires_1784549270189.jpg", description: "Медный силовой кабель, не поддерживающий горение, с низким дымовыделением. ГОСТ РБ." },
  { id: "feat_cable_2", name: "Кабель ВВГнг-LS 3х2.5 ГОСТ (для розеток)", unit: "метр", price: "По запросу", category: "Кабель и провод", subcategory: "Кабели силовые (ВВГнг, АВВГ, КГ)", image: "/images/catalog/cables_and_wires_1784549270189.jpg", description: "Силовой медный кабель ГОСТ для розеточных сетей частных домов и квартир." },
  { id: "feat_sock_1", name: "Розетка с заземлением BRITE (софт-тач белая)", unit: "шт", price: "По запросу", category: "Выключатели, розетки (BRITE, BYLECTRICA)", subcategory: "Розетки", image: "/images/catalog/sockets_and_switches_1784549255870.jpg", description: "Премиальная розетка серии BRITE со стойким приятным покрытием и защитными шторками." },
  { id: "feat_sock_2", name: "Выключатель 2-клавишный Bylectrica Пралеска", unit: "шт", price: "По запросу", category: "Выключатели, розетки (BRITE, BYLECTRICA)", subcategory: "Выключатели", image: "/images/catalog/sockets_and_switches_1784549255870.jpg", description: "Отечественный надежный выключатель Bylectrica скрытой установки. Стандарт РБ." },
  { id: "feat_mod_1", name: "Автоматический выключатель Legrand RX3 1P 16A C", unit: "шт", price: "По запросу", category: "Модульное оборудование", subcategory: "Автоматы", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=400&q=80", description: "Оригинальный автомат Legrand для защиты электрических сетей от перегрузок." },
  { id: "feat_well_1", name: "Скважинный насос Franklin Electric 4\" High Performance", unit: "шт", price: "По запросу", category: "Насосное оборудование", subcategory: "Скважинные насосы (ЭЦВ, СПА)", image: "/images/catalog/water_pumps_1784549298159.jpg", description: "Оригинальный глубоководный скважинный агрегат с двигателем Franklin Electric (США)." },
  { id: "feat_well_5", name: "Скважинный насос Omnigena 3B20 (230V)", unit: "шт", price: "По запросу", category: "Насосное оборудование", subcategory: "Скважинные насосы (ЭЦВ, СПА)", image: "/images/catalog/water_pumps_1784549298159.jpg", description: "Узкий 3-дюймовый погружной насос Omnigena для индивидуальных скважин." }
];

/**
 * ПОЛНЫЙ СПИСОК УСЛУГ ООО «БЕЛТЕХКОМПАНИЯ»
 */
export const SERVICES: Service[] = [
  {
    id: "smr",
    title: "Выполнение строительно-монтажных работ",
    category: "Строительно-монтажные работы",
    description: "Полный комплекс строительно-монтажных работ на объектах любого уровня сложности.",
    detailedDescription: "ООО «БелТехКомпания» (г. Ивацевичи, ул. Свердлова, 5) осуществляет квалифицированные строительно-монтажные работы под ключ. Имеем аттестаты соответствия, допуски и собственную материально-техническую базу.",
    image: "/images/services/mini-excavator.png",
    media: [],
    features: ["Общестроительные работы", "Парк спецтехники", "Соблюдение ТКП", "Инженерный надзор"]
  },
  {
    id: "internal_engineering",
    title: "Монтаж внутренних инженерных систем зданий и сооружений",
    category: "Инженерные системы",
    description: "Монтаж систем отопления, теплоснабжения вентиляционных установок, вентиляции и кондиционирования.",
    detailedDescription: "Профессиональный монтаж внутренних инженерных систем зданий и сооружений в строгом соответствии с ТКП и строительными нормами Республики Беларусь. Обеспечиваем полный цикл жизнеобеспечения объекта.",
    image: "/images/services/otoplenie.png",
    media: [],
    features: ["Монтаж отопления", "Внутренние сети водопровода", "Прокладка трубопроводов", "Пусконаладочные работы"]
  },
  {
    id: "heating_ventilation",
    title: "Монтаж систем отопления и теплоснабжения вентиляционных установок",
    category: "Инженерные системы",
    description: "Монтаж отопительных систем и обвязка теплоснабжения приточных вентиляционных установок.",
    detailedDescription: "Устройство систем отопления зданий и монтаж теплоснабжения вентиляционных установок (калориферов) любой мощности. Выполняем обвязку узлов регулирования.",
    image: "/images/services/obvyazka.png",
    media: [],
    features: ["Радиаторное отопление", "Теплоснабжение приточек", "Узлы регулирования", "Опрессовка систем"]
  },
  {
    id: "ventilation_conditioning",
    title: "Монтаж систем вентиляции и кондиционирования воздуха",
    category: "Инженерные системы",
    description: "Монтаж систем вентиляции и кондиционирования воздуха (за исключением систем противодымной вентиляции).",
    detailedDescription: "Обустройство систем приточной, вытяжной вентиляции и кондиционирования воздуха для жилых, коммерческих и промышленных зданий. Создаем комфортный микроклимат.",
    image: "/images/services/ventilyaciya.jpg",
    features: ["Воздуховоды любой сложности", "Рекуператоры", "VRF-системы", "Наладка очистки воздуха"],
    media: []
  },
  {
    id: "external_engineering",
    title: "Монтаж наружных инженерных сетей и сооружений",
    category: "Наружные сети",
    description: "Прокладка и монтаж наружных инженерных сетей и сооружений, включая монтаж тепловых сетей.",
    detailedDescription: "Строительство и реконструкция наружных инженерных коммуникаций: прокладка теплосетей, водопроводов и канализации. Выполняем весь комплекс земляных работ.",
    image: "/images/services/truba.png",
    media: [],
    features: ["Наружные тепловые сети", "Сети водопровода", "Земляные работы", "Монтаж колодцев и камер"]
  },
  {
    id: "thermal_networks",
    title: "Монтаж тепловых сетей",
    category: "Наружные сети",
    description: "Монтаж наружных тепловых сетей, магистральных трубопроводов и тепловых пунктов.",
    detailedDescription: "Профессиональная прокладка тепловых сетей с использованием современных ПИ-труб и запорной арматуры.",
    image: "/images/services/trubi.jpg",
    features: ["ПИ-трубопроводы в ППУ", "Неподвижные опоры", "Системы СОДК", "Сварка ПИ-труб"],
    media: []
  },
  {
    id: "internal_electrical",
    title: "Монтаж внутренних систем электроснабжения",
    category: "Электроснабжение",
    description: "Проектирование и монтаж внутренних систем электроснабжения зданий и сооружений.",
    detailedDescription: "Полный комплекс работ по устройству внутренних сетей электроснабжения, сборке электрощитов, разводке кабелей и монтажу оборудования.",
    image: "/images/services/shitok.jpg",
    media: [{ id: "iel1", type: "image", url: "/images/services/shitok111.jpg" }],
    features: ["Штробление и прокладка", "Сборка ВРУ и ГРЩ", "Установка розеток", "Проведение ЭФИ"]
  },
  {
    id: "external_electrical",
    title: "Монтаж наружных сетей электроснабжения, трансформаторных подстанций и распределительных устройств",
    category: "Электроснабжение",
    description: "Монтаж наружных электрических сетей, КТП и распределительных устройств.",
    detailedDescription: "Строительство кабельных и воздушных линий, монтаж комплектных трансформаторных подстанций и уличного освещения.",
    image: "/images/services/imba_shitok.jpg",
    features: ["Установка КТП", "Воздушные линии СИП", "Киосковые подстанции", "Контур заземления"],
    media: [
      { id: "eel1", type: "image", url: "/images/services/shitok5.jpg" },
      { id: "eel2", type: "image", url: "/images/services/shitok55.jpg" }
    ]
  },
  {
    id: "water_supply_and_heating",
    title: "Водоснабжение и отопление",
    category: "Водоснабжение и отопление",
    description: "Проектирование, монтаж и сервисное обслуживание систем водоснабжения и отопления.",
    detailedDescription: "Профессиональный монтаж автономных систем. Установка котлов под льготный тариф 0.04 руб/кВтч.",
    image: "/images/services/trubii.png",
    features: ["Системы из скважин", "Монтаж котлов (электро/газ)", "Водяные теплые полы", "Фильтрация воды"],
    media: [
      { id: "wsh3", type: "video", url: "/videos/services/trubi.mp4", poster: "/images/services/trubka1.png" },
      { id: "wsh4", type: "video", url: "/videos/services/trubii.mp4", poster: "/images/services/trubka2.png" },
      { id: "wsh2", type: "video", url: "/videos/services/truba.mp4", poster: "/images/services/trubka.png" }
    ]
  },
  {
    id: "heating_flushing",
    title: "Промывка и очистка систем отопления",
    category: "Водоснабжение и отопление",
    description: "Профессиональная гидропневматическая и химическая промывка радиаторов, полов и котлов.",
    detailedDescription: "Удаление отложений и накипи из системы отопления для восстановления теплоотдачи и экономии топлива. Используем спец. оборудование.",
    image: "/images/services/chistka.png",
    features: ["Гидропневматическая очистка", "Химическая промывка", "Замена теплоносителя", "Опрессовка системы"],
    media: [
      { id: "hf1", type: "video", url: "/videos/services/promivka.mp4", poster: "/images/services/chistka1.png" },
      { id: "hf2", type: "video", url: "/videos/services/promivka1.mp4", poster: "/images/services/chistka2.png" },
      { id: "hf3", type: "video", url: "/videos/services/promivka2.mp4", poster: "/images/services/chistka3.png" }
    ]
  }
];

export function getServices(): Service[] {
  return SERVICES;
}

export const BRANDS: Brand[] = [
  { name: "BRITE", country: "Россия", description: "Премиальная серия электроустановочных изделий." },
  { name: "BYLECTRICA", country: "Беларусь", description: "Отечественный стандарт качества." },
  { name: "Legrand", country: "Франция", description: "Мировой лидер электрооборудования." },
  { name: "Omnigena", country: "Польша", description: "Надежные насосы для водоснабжения." },
  { name: "Grundfos", country: "Дания", description: "Признанный мировой лидер насосных систем." }
];

/** Подкатегория по slug из URL (/catalog/:subcategorySlug) */
export function getSubcategoryBySlug(subcategorySlug: string): Subcategory | undefined {
  return ALL_SUBCATEGORIES.find((s) => s.slug === subcategorySlug);
}

/** Канонический slug подкатегории по id подкатегории товара */
export function getSlugForSubcategoryId(subcategoryId?: string) {
  if (!subcategoryId) return undefined;
  return SUBCATEGORY_INDEX.get(subcategoryId)?.subcategorySlug;
}

/** Товар по его slug (для страницы /catalog/:subcategorySlug/:productSlug) */
export function getProductBySlug(slug: string) {
  return PRICE_ITEMS.find((p) => p.slug === slug);
}