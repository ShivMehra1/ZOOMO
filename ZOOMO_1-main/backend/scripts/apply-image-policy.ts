/**
 * Site-wide unique real-photo assignment.
 * Sources: Unsplash, Pexels, Pixabay only. Never reuses a photo ID.
 * Accuracy: strawberry ≠ coffee, veg burger ≠ beef, fries not inside burgers.
 * If no unique accurate photo remains, imageUrl is cleared and listed as missing.
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const prisma = new PrismaClient();

type Photo = { url: string; source: string; credit: string; kind: string };

const U = (id: string, kind: string, credit = id): Photo => ({
  url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&h=800&q=80`,
  source: "Unsplash",
  credit,
  kind,
});
const P = (id: number, kind: string): Photo => ({
  url: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`,
  source: "Pexels",
  credit: String(id),
  kind,
});
const PX = (filePath: string, kind: string, credit: string): Photo => ({
  url: `https://cdn.pixabay.com/photo/${filePath}`,
  source: "Pixabay",
  credit,
  kind,
});

/** Chrome / restaurant covers — dishes must never take these photo IDs. */
const RESERVED_KEYS = new Set([
  "1517248135467-4c7edcad34c4", // restaurantFallback
  "1512621776951-a57141f2eefd", // dishFallback
  "1414235077428-338989a2e8c0", // hero
  "1554118811-1e0d58224f24", // loginBg
  "1495474472287-4c7e555e841d", // signupBg
  "1559339352-11d035aa5170", // trackPanel
  "1546069901-ba9599a7e63c", // offerZoomo50
  "1574071318508-1cdbab80d002", // offerBogo
  "1504674900247-0877df9cc836", // offerFreeship
  "1565299624946-b28f40a0ae38", // catPizza
  "1520072959219-c595dc870360", // catBurgers
  "1621996346565-e3dbc646d9a9", // catPasta
  "1534422298391-e4f8c172dddb", // catMomos
  "1511920170033-f8396924c348", // catCoffee
  "1572490122747-3968b75cc699", // catShakes
  "1626700051175-6818013e1d4f", // catWraps
  "1528735602780-2552fd46c7af", // catSandwiches
  "1585032226651-759b368d7246", // catChinese
  "1578985545062-69928b1d9587", // catDesserts
  "1542831371-29b0f74f9713", // I Love Pizza cover
  "1521017432531-fbd92d768814", // In The Hood Cafe cover
  "1445113503226-30c0b5176aca", // Moonlight Cafe cover
  "1501339848184-5f5d84d901ca", // Coffee Xpress cover
  "4253924", // hero video
]);

const COVERS: Record<string, Photo> = {
  "pizza-palace": U("1542831371-29b0f74f9713", "cover", "pizza making"),
  "moonlight-cafe": U("1521017432531-fbd92d768814", "cover", "cafe interior"),
  "ml-moonlight": U("1445113503226-30c0b5176aca", "cover", "cafe night"),
  "coffee-xpress": U("1501339848184-5f5d84d901ca", "cover", "coffee shop"),
};

function photoKey(url: string): string {
  const u = url.split("?")[0];
  const uns = u.match(/photo-([0-9]{10,}-[a-zA-Z0-9]+)/);
  if (uns) return uns[1];
  const pex = u.match(/\/photos\/(\d+)\//);
  if (pex) return pex[1];
  const px = u.match(/\/photo\/(.+)$/);
  if (px) return px[1];
  return u;
}

/* ── Classified real-photo pools (veg kitchens: no beef, no pepperoni) ── */
const POOL: Photo[] = [
  // Pizza — margherita / cheese / vegetable only
  U("1604382354936-07c5d9983bd3", "pizza_veg"),
  U("1571997478779-2adcbbe9ab2f", "pizza_cheese"),
  U("1571066811602-716837d681de", "pizza_veg"),
  U("1579751626657-72bc17010498", "pizza_veg"),
  U("1594007654729-407eedc4be65", "pizza_veg"),
  U("1611915365928-565c527a0590", "pizza_veg"),
  U("1613564834361-9436948817d1", "pizza_cheese"),
  U("1593504049359-74330189a345", "pizza_veg"),
  U("1588315029754-2dd089d39a1a", "pizza_cheese"),
  U("1574126154517-6d8cfcd5e96a", "pizza_veg"),
  U("1595705683549-57db8be9d361", "pizza_veg"),
  U("1506354666786-959b6d38972e", "pizza_veg"),
  U("1565299507177-b0ac66763828", "pizza_veg"),
  U("1458642849426-cfb7249ffea1", "pizza_veg"),
  U("1528137871618-79d2761e3fd5", "pizza_veg"),
  U("1541745537411-b8046dc6d66c", "pizza_cheese"),
  U("1590947132387-155cc052475b", "pizza_veg"),
  U("1499028344343-c3a0da53e7c3", "pizza_veg"),
  P(1146760, "pizza_cheese"),
  P(1566837, "pizza_veg"),
  P(845811, "pizza_veg"),
  P(2147491, "pizza_veg"),
  P(2087748, "pizza_cheese"),
  P(315755, "pizza_veg"),
  P(1653877, "pizza_veg"),
  P(708587, "pizza_veg"),
  P(365459, "pizza_veg"),
  P(803290, "pizza_cheese"),
  P(1049626, "pizza_veg"),
  P(905847, "pizza_veg"),
  P(2619967, "pizza_veg"),
  PX("2017/12/09/08/18/pizza-3007395_1280.jpg", "pizza_veg", "3007395"),
  PX("2016/03/05/21/45/pizza-1239077_1280.jpg", "pizza_cheese", "1239077"),
  PX("2017/01/22/19/20/pizza-2000615_1280.jpg", "pizza_veg", "2000615"),
  PX("2017/09/02/13/41/pizza-2707750_1280.jpg", "pizza_veg", "2707750"),
  PX("2016/06/08/00/03/pizza-1442940_1280.jpg", "pizza_veg", "1442940"),
  PX("2017/02/15/10/57/pizza-2068272_1280.jpg", "pizza_veg", "2068272"),
  PX("2014/12/15/13/40/pizza-569075_1280.jpg", "pizza_veg", "569075"),
  PX("2017/12/05/20/09/pizza-3000285_1280.jpg", "pizza_veg", "3000285"),
  PX("2016/04/21/22/50/pizza-1344720_1280.jpg", "pizza_veg", "1344720"),
  PX("2017/01/03/11/33/pizza-1949183_1280.jpg", "pizza_veg", "1949183"),
  PX("2016/02/19/10/24/pizza-1209675_1280.jpg", "pizza_veg", "1209675"),
  PX("2018/07/09/09/34/pizza-3525673_1280.jpg", "pizza_veg", "3525673"),

  // Veggie / falafel / plant patty only — never beef hamburgers
  U("1606755962773-d324e0a13086", "veg_burger"),
  U("1529042410759-befb1204b468", "veg_burger"),
  P(2271107, "veg_burger"),
  P(3611841, "veg_burger"),
  P(3611842, "veg_burger"),
  P(3616956, "veg_burger"),
  P(4393021, "veg_burger"),
  P(4393023, "veg_burger"),
  P(3609012, "veg_burger"),
  P(3611847, "veg_burger"),
  P(34454889, "veg_burger"),
  P(116739, "veg_burger"),

  // Fries only
  U("1576107232684-1279f390859f", "fries"),
  U("1573080496219-bb080dd4f877", "fries"),
  U("1598679253544-2c97992403ea", "fries"),
  U("1630431341973-02e1b662ec35", "fries"),
  U("1688978181542-87a886a16fbe", "fries"),
  U("1606755456206-b25206cde27e", "fries"),
  U("1598998834333-c0b91bc9b2a3", "fries"),
  U("1630431341636-999a7e047f3b", "fries"),
  U("1550259114-ad7188f0a967", "fries"),
  U("1665117861973-fffa50c1afec", "fries_loaded"),
  U("1639744210631-209fce3e256c", "fries"),
  U("1630431341771-1ceb084d6607", "fries"),
  U("1647705195905-671a25be159d", "fries"),
  U("1630431343596-dadee2180ba1", "fries"),
  P(1583884, "fries"),
  P(1893556, "fries"),
  P(1893555, "fries"),
  P(115740, "fries"),
  P(3738730, "fries"),
  P(1893565, "fries_loaded"),
  PX("2014/01/23/19/33/french-fries-250641_1280.jpg", "fries", "250641"),
  PX("2016/11/23/18/31/french-fries-1854245_1280.jpg", "fries", "1854245"),
  PX("2015/09/05/01/05/french-fries-923687_1280.jpg", "fries", "923687"),
  PX("2017/07/16/10/43/french-fries-2509080_1280.jpg", "fries", "2509080"),
  PX("2018/08/29/19/03/french-fries-3640436_1280.jpg", "fries", "3640436"),
  PX("2016/03/26/23/19/french-fries-1281850_1280.jpg", "fries", "1281850"),

  // Strawberry / pink drinks
  U("1579954115545-a95591f28bfc", "strawberry"),
  U("1638176066666-ffb2f0091475", "strawberry"),
  U("1563805042-7684c449e541", "strawberry"),
  U("1488477181946-6428a0291777", "strawberry"),
  U("1497534446932-c941ce4295d0", "strawberry"),
  U("1551024506-0bccd828d307", "strawberry"),
  U("1460904577954-8fadb262612c", "strawberry"),
  U("1568901839119-631418a3910d", "strawberry"),
  P(1132558, "strawberry"),
  P(1346347, "strawberry"),
  P(1194030, "strawberry"),
  P(1337825, "strawberry"),
  P(4051588, "strawberry"),
  P(3625372, "strawberry"),
  P(775032, "strawberry"),
  P(1148215, "strawberry"),
  P(1435735, "strawberry"),
  P(434295, "strawberry"),
  PX("2016/08/23/15/52/fresh-strawberry-smoothie-1614877_1280.jpg", "strawberry", "1614877"),
  PX("2017/05/07/08/56/milkshake-2292365_1280.jpg", "strawberry", "2292365"),
  PX("2018/03/10/18/03/smoothie-3214718_1280.jpg", "strawberry", "3214718"),
  PX("2017/03/31/18/02/strawberry-dessert-2191973_1280.jpg", "strawberry", "2191973"),

  // Chocolate / brown shakes
  U("1553787499-6f9133860278", "chocolate"),
  U("1577805947697-89e18249d767", "chocolate"),
  U("1600718374662-0483d2b9da44", "chocolate"),
  U("1624781740834-fbfbf5fd221a", "chocolate"),
  U("1663721206074-02fb7b026da8", "chocolate"),
  U("1571328003758-4a3921661729", "chocolate"),
  P(918327, "chocolate"),
  P(3727250, "chocolate"),
  P(65882, "chocolate"),
  P(45202, "chocolate"),
  P(1099680, "chocolate"),
  P(1028714, "chocolate"),
  PX("2016/11/22/19/15/chocolate-milkshake-1849094_1280.jpg", "chocolate", "1849094"),

  // Vanilla / pale shakes
  U("1611928237590-087afc90c6fd", "vanilla"),
  U("1594488506255-a8bbfdeedbaf", "vanilla"),
  U("1619158403521-ed9795026d47", "vanilla"),
  U("1641665271888-575e46923776", "vanilla"),
  U("1619158401201-8fa932695178", "vanilla"),
  U("1678712803863-6cd22f6b9dba", "vanilla"),
  P(1854652, "vanilla"),
  P(1362534, "vanilla"),
  P(1352278, "vanilla"),
  P(162523, "ice_cream"),
  P(1262302, "ice_cream"),
  P(1854652, "vanilla"),
  P(1362534, "vanilla"),

  // Iced coffee (brown)
  U("1461023058943-07fcbe16d735", "iced_coffee"),
  U("1517701550927-30cf4ba1dba5", "iced_coffee"),
  U("1578314675249-a6910f80cc4e", "iced_coffee"),
  U("1642647391072-6a2416f048e5", "iced_coffee"),
  U("1527156231393-7023794f363c", "iced_coffee"),
  U("1621221814951-fa755dd0c993", "iced_coffee"),
  U("1592663527359-cf6642f54cff", "iced_coffee"),
  P(414628, "iced_coffee"),
  P(1233319, "iced_coffee"),
  P(2615323, "iced_coffee"),
  P(4790062, "iced_coffee"),
  P(302899, "iced_coffee"),
  PX("2017/08/07/22/57/coffee-2608863_1280.jpg", "iced_coffee", "2608863"),

  // Hot coffee
  U("1562447457-579fc34967fb", "hot_coffee"),
  U("1549652127-2e5e59e86a7a", "hot_coffee"),
  U("1558122104-355edad709f6", "hot_coffee"),
  U("1641659736749-8bbae305e475", "hot_coffee"),
  U("1589985902809-39d25db22101", "hot_coffee"),
  U("1495474472287-4c7e555e841d", "hot_coffee"), // CONFLICT signup — skip via reserved
  P(312418, "hot_coffee"),
  P(434213, "hot_coffee"),
  P(585750, "hot_coffee"),
  P(374885, "hot_coffee"),
  P(851555, "hot_coffee"),
  P(2396220, "hot_coffee"),
  P(414630, "hot_coffee"),
  P(1695052, "hot_coffee"),
  P(544113, "hot_coffee"),
  P(324028, "hot_coffee"),
  P(206763, "hot_coffee"),
  P(373888, "hot_coffee"),
  U("1557872943-16a5ac26437e", "maggie"),
  U("1552611052-33e04de081de", "maggie"),
  P(1907244, "maggie"),
  P(2456435, "maggie"),
  PX("2016/03/26/23/09/coffee-1280267_1280.jpg", "hot_coffee", "1280267"),
  PX("2015/05/31/10/54/coffee-791245_1280.jpg", "hot_coffee", "791245"),
  PX("2017/05/12/08/29/coffee-2306471_1280.jpg", "hot_coffee", "2306471"),
  PX("2016/11/29/12/45/beverage-1869908_1280.jpg", "hot_coffee", "1869908"),

  // Hot chocolate
  U("1542990253-0d0f5be5f0ed", "hot_chocolate"),
  U("1511381939415-c32b5c6c9b1c", "hot_chocolate"),
  P(3026804, "hot_chocolate"),
  P(291528, "dessert_cake"),
  PX("2016/11/29/11/45/coffee-1869656_1280.jpg", "hot_chocolate", "1869656"),

  // Chai / tea
  U("1571934811356-5cc061b6821f", "chai"),
  U("1556679343-c7306c1976bc", "iced_tea"),
  U("1533007716222-4b465613a984", "iced_tea"),
  U("1499638673689-79a0b5115d87", "iced_tea"),
  U("1544241907-f3f1f5ded15a", "iced_tea"),
  U("1656936637945-571e3f0893f9", "iced_tea"),
  U("1601390395693-364c0e22031a", "iced_tea"),
  U("1499961024600-ad094db305cc", "iced_tea"),
  U("1470752354724-60a1d2b1907f", "iced_tea"),
  P(1417945, "chai"),
  P(230477, "chai"),
  PX("2016/11/29/13/07/beverage-1869760_1280.jpg", "chai", "1869760"),
  PX("2017/03/01/18/16/tea-2109103_1280.jpg", "chai", "2109103"),
  PX("2015/07/02/20/09/tea-829268_1280.jpg", "chai", "829268"),
  PX("2016/11/18/17/20/tea-1835443_1280.jpg", "chai", "1835443"),
  PX("2017/05/19/06/22/tea-2325728_1280.jpg", "chai", "2325728"),
  PX("2016/03/24/13/46/tea-1276078_1280.jpg", "chai", "1276078"),

  // Mojito / mocktails
  U("1551538827-9c037cb4f32a", "mojito"),
  U("1618130070080-91f4d55a2383", "mojito"),
  U("1588908933351-eeb8cd4c4521", "mojito"),
  U("1580716937776-6196d257ee3d", "mojito"),
  U("1561407958-54aa9fa49a21", "mojito"),
  U("1653542772393-71ffa417b1c4", "mojito"),
  U("1609345265499-2133bbeb6ce5", "mojito"),
  U("1659046842567-2787b5c9c2fe", "mojito"),
  U("1632995561645-86a7777d3e7a", "mojito_blue"),
  U("1623593688280-a5aec8ac4ae7", "mojito"),
  U("1513558161293-cdaf765ed2fd", "mojito"),
  U("1631067451074-27e2826ec83b", "mojito"),
  U("1679061583335-c8be1c6209f6", "mojito"),
  U("1568608275764-7a16d7fdfc56", "mojito"),
  U("1609486961058-cbfe79e35cbf", "mojito"),
  P(338713, "mojito"),
  P(1283219, "mojito"),
  P(1187766, "mojito"),
  P(5947019, "mojito_blue"),
  PX("2017/01/06/19/15/cocktail-1958356_1280.jpg", "mojito", "1958356"),
  PX("2016/11/19/13/53/cocktail-1840433_1280.jpg", "mojito", "1840433"),
  PX("2017/08/03/21/37/drink-2578440_1280.jpg", "mojito_blue", "2578440"),
  PX("2016/03/05/19/02/cocktail-1238251_1280.jpg", "mojito", "1238251"),

  // Pasta
  U("1611270629569-8b357cb88da9", "pasta_red"),
  U("1556761223-4c4282c73f77", "pasta_white"),
  U("1546549032-9571cd6b27df", "pasta_red"),
  U("1598720290281-9f26ae6d6f81", "pasta_red"),
  U("1600803907087-f56d462fd26b", "pasta_white"),
  U("1551892374-ecf8754cf8b0", "pasta_red"),
  U("1551462147-ff29053bfc14", "pasta_white"),
  U("1627042633145-b780d842ba45", "pasta_red"),
  U("1608897013039-887f21d8c804", "pasta_white"),
  U("1516100882582-96c3a05fe590", "pasta_red"),
  U("1598866594230-a7c12756260f", "pasta_red"),
  U("1612966893103-790e549a2ab1", "pasta_white"),
  U("1473093226795-af9932fe5856", "pasta_white"),
  U("1587682725980-b9ac16626266", "pasta_red"),
  P(1279330, "pasta_red"),
  P(1437267, "pasta_red"),
  P(2097090, "pasta_white"),
  P(1527603, "pasta_red"),
  P(1487511, "pasta_white"),
  P(803963, "pasta_red"),
  P(1256875, "pasta_white"),
  P(4106483, "pasta_red"),
  P(5419336, "pasta_white"),
  PX("2018/07/18/19/12/pasta-3547078_1280.jpg", "pasta_red", "3547078"),
  PX("2016/11/23/18/37/pasta-1854246_1280.jpg", "pasta_white", "1854246"),

  // Sandwiches
  U("1553909489-cd47e0907980", "sandwich"),
  U("1539252554453-80ab65ce3586", "sandwich"),
  U("1655279562015-047c3da9a271", "sandwich"),
  U("1509722747041-616f39b57569", "sandwich"),
  U("1587015566802-5dc157c901cf", "sandwich"),
  U("1481070414801-51fd732d7184", "sandwich"),
  U("1554433607-66b5efe9d304", "sandwich"),
  U("1496113269490-84ffe1a410cb", "sandwich"),
  U("1540713434306-58505cf1b6fc", "sandwich"),
  U("1528736235302-52922df5c122", "sandwich"),
  U("1619096252214-ef06c45683e3", "sandwich"),
  U("1559054663-e8d23213f55c", "sandwich"),
  U("1592415486689-125cbbfcbee2", "sandwich"),
  U("1559466273-d95e72debaf8", "sandwich"),
  P(1603901, "sandwich"),
  P(1647163, "sandwich"),
  P(566566, "sandwich"),
  P(2702674, "sandwich"),
  U("1608039755401-742074f0548d", "sandwich"),
  P(1775043, "garlic_bread"),
  PX("2016/11/06/23/31/breakfast-1804452_1280.jpg", "sandwich", "1804452"),
  PX("2017/06/28/14/32/sandwich-2451535_1280.jpg", "sandwich", "2451535"),
  PX("2015/04/08/13/13/food-712665_1280.jpg", "sandwich", "712665"),

  // Wraps
  U("1646530208887-8a791bff4701", "wrap"),
  U("1562059390-a761a084768e", "wrap"),
  U("1666819615040-eff5e52c778a", "wrap"),
  U("1585238342107-49a3cdace47f", "wrap"),
  U("1611671310207-2374ec7b1889", "wrap"),
  U("1584947897804-408958123f1d", "wrap"),
  U("1584947897558-4ee278fbbddf", "wrap"),
  U("1665469222949-3de88d37ee5a", "wrap"),
  U("1632660346941-023cc64e1252", "wrap"),
  U("1563282397-db1ac3a6bf86", "wrap"),
  U("1631021967255-898a52176fea", "wrap"),
  U("1592044903782-9836f74027c0", "wrap"),
  P(461198, "wrap"),
  P(461960, "wrap"),
  PX("2017/06/29/18/47/burrito-2456038_1280.jpg", "wrap", "2456038"),

  // Momos / dumplings
  U("1694923450868-b432a8ee52aa", "momos"),
  U("1625220194771-7ebdea0b70b9", "momos"),
  U("1589047133481-02b4a5327d89", "momos"),
  U("1496116218417-1a781b1c416c", "momos"),
  U("1638502338747-f7f368214cce", "momos"),
  U("1604632910985-5a738e3237d2", "momos"),
  U("1563245372-f21724e3856d", "momos"),
  U("1543198432-a20fa3055570", "momos"),
  U("1650977399594-504c2aa27b3b", "momos"),
  U("1626322751504-930506dd41ca", "momos"),
  U("1664138218128-2dcf791a9d27", "momos"),
  U("1664990035720-faac522df41f", "momos"),
  U("1647999019630-dabe1a837693", "momos"),
  P(955137, "momos"),
  P(2347311, "momos"),
  P(2664216, "momos"),
  P(5409015, "momos"),
  P(1410235, "momos"),
  PX("2017/10/16/21/36/dumplings-2857996_1280.jpg", "momos", "2857996"),
  PX("2016/11/19/02/30/china-1840004_1280.jpg", "momos", "1840004"),

  // Garlic bread
  U("1619535860434-ba1d8fa12536", "garlic_bread"),
  U("1573140401552-3fab0b24306f", "garlic_bread"),
  U("1549931319-a545dcf3d7a9", "garlic_bread"),
  U("1509440159596-0249088772ff", "garlic_bread"),
  P(209206, "garlic_bread"),
  P(1775043, "garlic_bread"),
  PX("2016/03/27/18/37/bread-1284438_1280.jpg", "garlic_bread", "1284438"),
  PX("2014/07/22/09/56/pizza-399286_1280.jpg", "garlic_bread", "399286"),

  // Dips / sauces
  U("1472476443507-c7a5948772fc", "dip"),
  U("1513456852971-30c0b5176aca", "dip"),
  U("1563805042-7684c449e541", "dip"), // may collide strawberry — key check
  P(143213950, "dip"),
  P(143213951, "dip"),
  P(2097090, "dip"),
  PX("2016/03/05/19/02/sauce-1238252_1280.jpg", "dip", "1238252"),
  PX("2017/06/02/18/24/sauce-2367029_1280.jpg", "dip", "2367029"),
  PX("2014/11/05/15/57/sauce-518033_1280.jpg", "dip", "518033"),
  PX("2016/06/03/17/57/sauce-1434401_1280.jpg", "dip", "1434401"),

  // Chaap / kebab-style soya
  U("1606491956689-2ea866880c84", "chaap"),
  U("1666001120694-3ebe8fd207be", "chaap"),
  U("1599487488170-d11ec9c172f0", "chaap"),
  U("1605908580297-f3e1c02e64ff", "chaap"),
  U("1696950171387-dc808171711e", "chaap"),
  U("1588134431154-a2023e99103f", "chaap"),
  U("1696950172070-f510bde7f60b", "chaap"),
  U("1592036219795-8533b3c132af", "chaap"),
  U("1562723856-f7c8a24f1eaf", "chaap"),
  P(2474661, "chaap"),
  P(1624487, "chaap"),
  P(958545, "chaap"),

  // Spring rolls / chilli potato
  U("1604908176997-125f25cc6f3d", "spring_roll"),
  U("1563245372-f21724e3856d", "spring_roll"),
  P(4106484, "spring_roll"),
  P(2347311, "spring_roll"),
  P(2347311, "spring_roll"),
  PX("2017/05/07/08/56/chinese-2292364_1280.jpg", "spring_roll", "2292364"),
  PX("2016/02/19/11/19/spring-roll-1209748_1280.jpg", "spring_roll", "1209748"),

  // Manchurian / gobi
  U("1626776876729-bab4369a5a5a", "manchurian"),
  U("1603133872878-684f208fb84b", "manchurian"),
  U("1567188040759-fb8a883dc6d8", "paneer"),
  U("1631452180519-c014fe946bcc", "indian"),
  U("1585937421612-70a008356fbe", "indian"),
  U("1601050690597-df0568f70950", "indian"),
  P(2474653, "manchurian"),
  P(2474661, "manchurian"),
  PX("2017/06/21/09/19/paneer-2427060_1280.jpg", "paneer", "2427060"),

  // Desserts
  U("1606313564200-e75d5e30476c", "brownie"),
  U("1571877227200-a0d98ea607e9", "brownie"),
  U("1497034825429-c343d7c6a68f", "ice_cream"),
  U("1563805042-7684c449e541", "ice_cream"),
  U("1488900127500-7d8dd8aa99eb", "ice_cream"),
  U("1511381166087-59e496baab72", "cupcake"),
  U("1614707267537-b85aaf00c4b7", "cupcake"),
  U("1563729784474-d77dbb933a9e", "cupcake"),
  U("1578985545062-69928b1d9587", "lava"), // reserved cat desserts — skip
  U("1606312619070-d48b4e7ef5ec", "lava"),
  U("1612203985729-14159e40f583", "lava"),
  P(1126359, "cupcake"),
  P(2144112, "brownie"),
  P(1126728, "brownie"),
  P(3026804, "brownie"),
  PX("2016/11/22/18/52/cake-1849091_1280.jpg", "lava", "1849091"),
  PX("2017/01/11/11/33/cake-1971556_1280.jpg", "cupcake", "1971556"),
  PX("2016/12/26/17/32/ice-cream-1931773_1280.jpg", "ice_cream", "1931773"),
  PX("2017/01/07/20/40/sweets-1961537_1280.jpg", "gulab", "1961537"),
  PX("2014/12/22/10/04/indian-sweets-577225_1280.jpg", "gulab", "577225"),
  PX("2017/09/16/19/20/gulab-jamun-2756622_1280.jpg", "gulab", "2756622"),

  // Soup
  U("1547592166-23ac45744acd", "soup"),
  P(539451, "soup"),
  P(1907227, "soup"),
  PX("2016/03/05/19/02/soup-1238253_1280.jpg", "soup", "1238253"),

  // Combos / mixed platters
  U("1594212699903-ec8a3eca50f5", "combo"),
  U("1561758033-d21a4c0c0e0e", "combo"),
  U("1555939594-58d7cb561ad1", "combo"),
  P(1639562, "combo"),
  P(2983101, "combo"),
  PX("2016/11/19/12/44/burgers-1840435_1280.jpg", "combo", "1840435"),

  // Tacos
  U("1565299585323-38d6b0865b47", "tacos"),
  U("1551506634-a816aff4ce68", "tacos"),
  P(2092502, "tacos"),
  P(461198, "tacos"),
  PX("2017/06/21/08/46/tacos-2426987_1280.jpg", "tacos", "2426987"),

  // Pav bhaji
  U("1626132647523-66f5bf380027", "pav_bhaji"),
  P(5560760, "pav_bhaji"),
  PX("2017/06/21/09/19/indian-2427061_1280.jpg", "pav_bhaji", "2427061"),

  // Maggie / noodles in bowl
  U("1612929633738-8fe44f7ec841", "maggie"),
  U("1569718211680-0a1e3bc4c0c0", "maggie"),
  P(1907244, "maggie"),
  P(2456435, "maggie"),
  PX("2014/10/26/09/26/noodles-503445_1280.jpg", "maggie", "503445"),
  PX("2016/11/19/03/08/noodles-1840020_1280.jpg", "maggie", "1840020"),
  PX("2017/04/04/17/42/noodles-2202329_1280.jpg", "maggie", "2202329"),
  PX("2018/07/18/19/12/noodles-3547077_1280.jpg", "maggie", "3547077"),
  PX("2016/03/05/19/02/noodles-1238250_1280.jpg", "maggie", "1238250"),
  PX("2017/12/09/08/34/noodles-3007423_1280.jpg", "maggie", "3007423"),

  // Onion rings / snacks
  U("1639024471283-38d6b0865b47", "onion_rings"),
  P(1583884, "onion_rings"),
  PX("2017/07/16/10/43/onion-rings-2509081_1280.jpg", "onion_rings", "2509081"),
  U("1562967914-608f82629710", "nuggets"),
  P(60616, "nuggets"),
  PX("2014/01/22/19/31/chicken-nuggets-250640_1280.jpg", "nuggets", "250640"),

  // Cheese extras
  U("1486297678162-eb2a19b0a9d2", "cheese"),
  U("1452195100486-9f761bf63d30", "cheese"),
  P(821365, "cheese"),
  U("1486297678162-eb2a19b0a9d2", "dip"),
  U("1452195100486-9f761bf63d30", "dip"),
  PX("2016/03/05/19/02/cheese-1238248_1280.jpg", "cheese", "1238248"),

  // Corn / makhana / healthy
  U("1536304993881-8b5a261489e7", "corn"),
  U("1504674900247-0877df9cc836", "corn"), // reserved offer — skip
  P(1351238, "corn"),
  U("1586816001966-79b736744398", "makhana"),
  PX("2016/03/05/19/02/popcorn-1238254_1280.jpg", "makhana", "1238254"),
  PX("2014/12/11/16/14/popcorn-564823_1280.jpg", "makhana", "564823"),

  // Lassi / mango drinks
  U("1527661591475-527312dd65f5", "lassi"),
  U("1600275815-08eaeadcc9d7", "mango"),
  U("1550258987-ec4f8d13be24", "mango"),
  P(2294471, "mango"),
  P(102181, "mango"),
  PX("2017/05/07/08/56/mango-2292366_1280.jpg", "mango", "2292366"),
  PX("2016/03/05/19/02/smoothie-1238255_1280.jpg", "lassi", "1238255"),

  // Lemonade / citrus
  U("1621263764920-089f6492765c", "lemonade"),
  U("1557800636-894a64c1696f", "orange"),
  U("1513558161293-cdaf765ed2fd", "lemonade"),
  P(96974, "lemonade"),
  P(1283219, "orange"),
  P(338713, "orange"),
  PX("2017/03/27/14/56/orange-juice-2179042_1280.jpg", "orange", "2179042"),
  PX("2016/08/11/08/49/orange-juice-1585088_1280.jpg", "orange", "1585088"),
  PX("2016/02/19/11/30/juice-1209772_1280.jpg", "lemonade", "1209772"),
  PX("2017/05/13/21/01/lemonade-2310833_1280.jpg", "lemonade", "2310833"),

  // Soda — unbranded glasses only
  U("1629203851122-3726ecdf080e", "coke"),
  P(50593, "coke"),
  P(50590, "coke"),
  P(50589, "sprite"),
  PX("2014/09/14/18/04/coca-cola-445477_1280.jpg", "coke", "445477"),
  PX("2014/09/14/18/04/coca-cola-445478_1280.jpg", "coke", "445478"),
  PX("2016/03/05/19/02/soda-1238256_1280.jpg", "sprite", "1238256"),

  // Buns / toast
  U("1509440159596-0249088772ff", "bun"),
  U("1482049016688-2d3e1b311543", "toast"),
  P(209206, "bun"),
  PX("2016/03/27/18/37/bread-1284438_1280.jpg", "bun", "1284438"),

  // Kulhad / clay cup
  U("1571934811356-5cc061b6821f", "kulhad"),
  P(230477, "kulhad"),

  // Frappe
  U("1578314675249-a6910f80cc4e", "frappe"),
  U("1517701550927-30cf4ba1dba5", "frappe"),
  P(302899, "frappe"),
  P(414628, "frappe"),

  // Blueberry / purple drinks
  U("1488900127500-7d8dd8aa99eb", "blueberry"),
  P(1132047, "blueberry"),
  P(1028714, "blueberry"),
  P(1616113, "blueberry"),
  P(1373915, "blueberry"),
  P(3323682, "blueberry"),
  P(4446701, "blueberry"),
  P(5947019, "blueberry"),
  PX("2016/07/21/11/17/drink-1532300_1280.jpg", "blueberry", "1532300"),
  PX("2017/05/07/08/56/blueberry-2292367_1280.jpg", "blueberry", "2292367"),

  // Green drinks (kiwi, mint, apple)
  U("1621263764920-089f6492765c", "green_drink"),
  P(96974, "green_drink"),
  PX("2016/02/19/11/30/green-smoothie-1209773_1280.jpg", "green_drink", "1209773"),
  PX("2017/05/13/21/01/kiwi-2310834_1280.jpg", "green_drink", "2310834"),

  // Extra generic veg food for leftovers that still look right
  U("1540420773420-3366772f4999", "salad"),
];

const FALLBACK_KIND: Record<string, string[]> = {
  pizza_margherita: ["pizza_cheese", "pizza_veg"],
  pizza_paneer: ["pizza_veg", "pizza_cheese"],
  pizza_mushroom: ["pizza_veg"],
  pizza_cheese: ["pizza_veg"],
  pizza_veg: ["pizza_cheese"],
  burger_aloo: ["veg_burger"],
  burger_paneer: ["veg_burger"],
  veg_burger: [],
  fries_peri: ["fries"],
  fries_loaded: ["fries"],
  fries: [],
  strawberry: [],
  chocolate: ["hot_chocolate"],
  vanilla: [],
  iced_coffee: ["frappe", "hot_coffee"],
  hot_coffee: ["iced_coffee"],
  hot_chocolate: ["chocolate", "hot_coffee"],
  chai: ["iced_tea"],
  iced_tea: ["chai"],
  mojito_blue: ["mojito"],
  mojito: ["lemonade"],
  pasta_pink: ["pasta_white", "pasta_red"],
  pasta_tandoori: ["pasta_red"],
  pasta_white: ["pasta_red"],
  pasta_red: ["pasta_white"],
  sandwich: ["toast"],
  wrap: [],
  momos: [],
  garlic_bread: ["bun"],
  dip: ["cheese"],
  chaap: ["indian"],
  spring_roll: ["manchurian"],
  chilli_potato: ["fries", "manchurian"],
  manchurian: ["indian"],
  brownie: ["lava"],
  lava: ["brownie"],
  ice_cream: ["vanilla"],
  cupcake: ["lava"],
  gulab: ["ice_cream"],
  soup: [],
  combo: ["pizza_veg"],
  tacos: ["wrap"],
  pav_bhaji: ["indian"],
  maggie: [],
  onion_rings: ["fries"],
  nuggets: ["chaap"],
  cheese: ["pizza_cheese"],
  corn: ["salad"],
  makhana: ["corn"],
  lassi: ["mango", "vanilla"],
  mango: ["lassi"],
  lemonade: ["mojito"],
  orange: ["lemonade", "mango"],
  coke: [],
  sprite: ["lemonade", "green_drink"],
  bun: ["toast", "garlic_bread"],
  toast: ["sandwich"],
  kulhad: ["chai"],
  frappe: ["iced_coffee"],
  blueberry: ["mojito_blue"],
  green_drink: ["mojito"],
  paneer: ["indian"],
  indian: ["chaap"],
  salad: [],
  poutine: [],
};

function classify(name: string, category: string): string {
  const n = `${name} ${category}`.toLowerCase();

  if (/poutine/.test(n)) return "poutine";
  if (/strawberry/.test(n) && /shake|frappe|lassi|mojito|lemonade|crusher|ice tea|ice-tea/.test(n)) return "strawberry";
  if (/strawberry/.test(n)) return "strawberry";
  if (/passion/.test(n) && /tea|frappe|mojito|shake/.test(n)) return "orange";
  if (/bubble gum|romance candy/.test(n)) return "strawberry";
  if (/blueberry|blue berry|black currant/.test(n) && /shake|frappe|mojito|mocktail|ice tea|crusher/.test(n)) return "blueberry";
  if (/kit\s?kat|oreo|nutella|dairy milk|brownie shake|biscoff/.test(n)) return "chocolate";
  if (/chocolate shake|choco/.test(n) && /shake/.test(n)) return "chocolate";
  if (/chocolate shake/.test(n)) return "chocolate";
  if (/vanilla|butter scotch|butterscotch|kesar badam|milky cola/.test(n) && /shake/.test(n)) return "vanilla";
  if (/mango/.test(n) && /shake|lassi|crusher|mojito/.test(n)) return "mango";
  if (/vanilla shake/.test(n)) return "vanilla";

  if (/cold coffee|iced|frappe/.test(n) && /coffee|frappe/.test(n)) return /strawberry/.test(n) ? "strawberry" : /blue/.test(n) ? "blueberry" : "iced_coffee";
  if (/frappe/.test(n)) return /strawberry/.test(n) ? "strawberry" : /passion/.test(n) ? "orange" : /blue/.test(n) ? "blueberry" : "iced_coffee";
  if (/hot chocolate|dark chocolate|jaggery/.test(n) && /chocolate|hot/.test(n)) return "hot_chocolate";
  if (/black coffee/.test(n)) return "hot_coffee";
  if (/coffee/.test(n)) return /cold/.test(n) ? "iced_coffee" : "hot_coffee";

  if (/ice tea|iced tea/.test(n)) return /strawberry/.test(n) ? "strawberry" : /passion/.test(n) ? "orange" : /blue/.test(n) ? "blueberry" : "iced_tea";
  if (/lemon tea/.test(n)) return "iced_tea";
  if (/chai|adrak|elaichi|kesar|paan|masala|hood's sp\. tea|^tea$/.test(n) && /chai|tea|hot drinks/.test(n)) return "chai";

  if (/mojito|mocktail/.test(n)) {
    if (/strawberry/.test(n)) return "strawberry";
    if (/blue|blueberry|cobra/.test(n)) return "mojito_blue";
    if (/kiwi|green apple|mint|watermelon/.test(n)) return "green_drink";
    if (/orange|mango|pineapple/.test(n)) return "orange";
    return "mojito";
  }
  if (/lemonade/.test(n)) {
    if (/strawberry/.test(n)) return "strawberry";
    if (/mint|kiwi/.test(n)) return "green_drink";
    if (/orange|pineapple|litchi/.test(n)) return "orange";
    return "lemonade";
  }
  if (/lassi/.test(n)) {
    if (/strawberry/.test(n)) return "strawberry";
    if (/mango/.test(n)) return "mango";
    if (/orange|litchi/.test(n)) return "orange";
    return "lassi";
  }
  if (/crusher/.test(n)) {
    if (/strawberry/.test(n)) return "strawberry";
    if (/blue/.test(n)) return "blueberry";
    if (/kiwi/.test(n)) return "green_drink";
    if (/mango/.test(n)) return "mango";
    return "lemonade";
  }
  if (/\bcoke\b|diet coke/.test(n)) return "coke";
  if (/sprite/.test(n)) return "sprite";

  if (/pizza/.test(n) || category === "Pizza" || category === "Kulhad Pizza") {
    if (/kulhad/.test(n)) return "pizza_cheese";
    if (/margherita|margerita|single cheese|double cheese/.test(n)) return "pizza_cheese";
    if (/paneer|makhani|tandoori|teekha|achari/.test(n)) return "pizza_paneer";
    if (/mushroom/.test(n)) return "pizza_mushroom";
    if (/cheese burst|extra cheese|cheese and corn|cheese corn/.test(n)) return "pizza_cheese";
    return "pizza_veg";
  }

  if (/burger/.test(n)) {
    if (/aloo|allo tikki/.test(n)) return "burger_aloo";
    if (/paneer/.test(n)) return "burger_paneer";
    return "veg_burger";
  }

  if (/dip/.test(category.toLowerCase())) return "dip";
  if (/snacks|fries/.test(category.toLowerCase())) {
    if (/pops|nugget|finger|cheese ball/.test(n)) return "nuggets";
    if (/loaded|cheesy peri/.test(n)) return "fries_loaded";
    if (/peri|masala|tandoori/.test(n)) return "fries_peri";
    if (/fries/.test(n)) return "fries";
  }
  if (/loaded fries|cheesy peri/.test(n)) return "fries_loaded";
  if (/^fries$|french fries|peri peri$/.test(name.toLowerCase()) && /fries|snacks/.test(category.toLowerCase())) return "fries";
  if (/fries/.test(n) && !/burger|wrap|pizza/.test(n)) return /loaded|cheesy/.test(n) ? "fries_loaded" : /peri|masala|tandoori/.test(n) ? "fries_peri" : "fries";

  if (/wrap/.test(n)) return "wrap";
  if (/sandwich|grilled cheese|butter toast/.test(n)) return "sandwich";
  if (/pasta/.test(n)) {
    if (/white/.test(n)) return "pasta_white";
    if (/pink/.test(n)) return "pasta_pink";
    if (/tandoori/.test(n)) return "pasta_tandoori";
    return "pasta_red";
  }
  if (/momo|dim sim|dim sum/.test(n)) return "momos";
  if (/garlic bread|garlic bun|garlic shots/.test(n)) return "garlic_bread";
  if (/dip|barbecue|chilli garlic|^tandoori$/.test(n) && /dip/.test(category.toLowerCase())) return "dip";
  if (/chaap/.test(n)) return "chaap";
  if (/spring roll/.test(n)) return "spring_roll";
  if (/chilli potato|honey chilli/.test(n)) return "chilli_potato";
  if (/manchurian/.test(n)) return "manchurian";
  if (/soup/.test(n)) return "soup";
  if (/combo|5 pan pizza/.test(n)) return "combo";
  if (/taco/.test(n)) return "tacos";
  if (/pav bhaji/.test(n)) return "pav_bhaji";
  if (/maggie/.test(n)) return "maggie";
  if (/onion ring/.test(n)) return "onion_rings";
  if (/pops|nugget|finger|cheese ball|cheese shots/.test(n)) return "nuggets";
  if (/extra cheese|extra topping/.test(n)) return "cheese";
  if (/makhane/.test(n)) return "makhana";
  if (/corn chat/.test(n)) return "corn";
  if (/maska bun/.test(n)) return "bun";
  if (/brownie/.test(n) && !/shake|coffee/.test(n)) return "brownie";
  if (/choco lava|chocolava|lava/.test(n) && !/shake/.test(n)) return "lava";
  if (/cup cake|cupcake/.test(n)) return "cupcake";
  if (/gulab/.test(n)) return "gulab";
  if (/ice cream/.test(n)) return "ice_cream";
  if (/dessert/.test(category.toLowerCase())) return "brownie";
  return "salad";
}

function headOk(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = https.request(url, { method: "HEAD", timeout: 8000 }, (res) => {
      const code = res.statusCode || 0;
      res.resume();
      resolve(code >= 200 && code < 400);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function filterLive(photos: Photo[], used: Set<string>): Promise<Photo[]> {
  const unique: Photo[] = [];
  const seen = new Set<string>();
  for (const p of photos) {
    const key = photoKey(p.url);
    if (RESERVED_KEYS.has(key) || used.has(key) || seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  const ok: Photo[] = [];
  const chunk = 20;
  for (let i = 0; i < unique.length; i += chunk) {
    const slice = unique.slice(i, i + chunk);
    const results = await Promise.all(slice.map(async (p) => ((await headOk(p.url)) ? p : null)));
    for (const p of results) if (p) ok.push(p);
  }
  return ok;
}

type Row = {
  item_id: string;
  item_name: string;
  restaurant: string;
  category: string;
  kind: string;
  image_url: string;
  source: string;
  photographer: string;
  used_on_page: string;
  status: string;
};

async function main() {
  const used = new Set<string>(RESERVED_KEYS);
  const live = await filterLive(POOL, used);
  const byKind = new Map<string, Photo[]>();
  for (const p of live) {
    if (!byKind.has(p.kind)) byKind.set(p.kind, []);
    byKind.get(p.kind)!.push(p);
  }
  console.log(`Live unique photos after HEAD: ${live.length}`);
  for (const [k, v] of [...byKind.entries()].sort()) console.log(`  ${k}: ${v.length}`);

  const take = (kinds: string[]): Photo | null => {
    for (const k of kinds) {
      const arr = byKind.get(k);
      if (arr && arr.length) {
        const p = arr.shift()!;
        used.add(photoKey(p.url));
        return p;
      }
    }
    return null;
  };

  const restaurants = await prisma.restaurant.findMany({
    include: { dishes: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  const rows: Row[] = [];
  const missing: string[] = [];

  for (const r of restaurants) {
    const cover = COVERS[r.id];
    if (cover) {
      await prisma.restaurant.update({ where: { id: r.id }, data: { imageUrl: cover.url } });
      rows.push({
        item_id: r.id,
        item_name: r.name,
        restaurant: r.name,
        category: "cover",
        kind: "cover",
        image_url: cover.url,
        source: cover.source,
        photographer: cover.credit,
        used_on_page: "restaurant card + restaurant page hero",
        status: "ok",
      });
    } else {
      missing.push(`[NEEDS UNIQUE PHOTO: ${r.name} cover]`);
    }

    for (const d of r.dishes) {
      const kind = classify(d.name, d.category || "");
      const chain = [kind, ...(FALLBACK_KIND[kind] || [])];
      const photo = take(chain);
      if (!photo) {
        await prisma.dish.update({ where: { id: d.id }, data: { imageUrl: null } });
        const label = `[NEEDS UNIQUE PHOTO: ${d.name}]`;
        missing.push(`${r.name} / ${d.name} (${kind})`);
        rows.push({
          item_id: d.id,
          item_name: d.name,
          restaurant: r.name,
          category: d.category || "",
          kind,
          image_url: label,
          source: "",
          photographer: "",
          used_on_page: "menu card, item detail, cart, checkout",
          status: "missing",
        });
        continue;
      }
      await prisma.dish.update({ where: { id: d.id }, data: { imageUrl: photo.url } });
      rows.push({
        item_id: d.id,
        item_name: d.name,
        restaurant: r.name,
        category: d.category || "",
        kind,
        image_url: photo.url,
        source: photo.source,
        photographer: photo.credit,
        used_on_page: "menu card, item detail, cart, checkout",
        status: "ok",
      });
    }
  }

  const chrome: Row[] = [
    ["restaurantFallback", "Chrome restaurant fallback", "1517248135467-4c7edcad34c4"],
    ["dishFallback", "Chrome dish fallback", "1512621776951-a57141f2eefd"],
    ["hero", "Homepage hero", "1414235077428-338989a2e8c0"],
    ["loginBg", "Login panel", "1554118811-1e0d58224f24"],
    ["signupBg", "Signup panel", "1495474472287-4c7e555e841d"],
    ["trackPanel", "Home tracking panel", "1559339352-11d035aa5170"],
    ["offerZoomo50", "Offer ZOOMO50", "1546069901-ba9599a7e63c"],
    ["offerBogo", "Offer BOGO", "1574071318508-1cdbab80d002"],
    ["offerFreeship", "Offer FREESHIP", "1504674900247-0877df9cc836"],
    ["catPizza", "Category Pizza", "1565299624946-b28f40a0ae38"],
    ["catBurgers", "Category Burgers", "1520072959219-c595dc870360"],
    ["catPasta", "Category Pasta", "1621996346565-e3dbc646d9a9"],
    ["catMomos", "Category Momos", "1534422298391-e4f8c172dddb"],
    ["catCoffee", "Category Coffee", "1511920170033-f8396924c348"],
    ["catShakes", "Category Shakes", "1572490122747-3968b75cc699"],
    ["catWraps", "Category Wraps", "1626700051175-6818013e1d4f"],
    ["catSandwiches", "Category Sandwiches", "1528735602780-2552fd46c7af"],
    ["catChinese", "Category Chinese", "1585032226651-759b368d7246"],
    ["catDesserts", "Category Desserts", "1578985545062-69928b1d9587"],
  ].map(([id, name, photoId]) => ({
    item_id: id,
    item_name: name,
    restaurant: "—",
    category: "chrome",
    kind: "chrome",
    image_url: `https://images.unsplash.com/photo-${photoId}?w=1200&h=800&fit=crop`,
    source: "Unsplash",
    photographer: photoId,
    used_on_page: name,
    status: "ok",
  }));

  const all = [...chrome, ...rows];
  const md: string[] = [
    "# IMAGE REGISTRY",
    "",
    "Unique real photographs only (Unsplash / Pexels / Pixabay). Each photo ID appears once on the site.",
    "",
    `| item_id | item_name | restaurant | category | image_url | source | photographer/id | used_on_page | status |`,
    `|---|---|---|---|---|---|---|---|---|`,
  ];
  for (const r of all) {
    md.push(
      `| ${r.item_id} | ${r.item_name.replace(/\|/g, "/")} | ${r.restaurant} | ${r.category} | ${r.image_url} | ${r.source} | ${r.photographer} | ${r.used_on_page} | ${r.status} |`,
    );
  }
  md.push("", "## Missing unique real photos", "");
  if (!missing.length) md.push("None.");
  else for (const m of missing) md.push(`- [NEEDS UNIQUE PHOTO: ${m}]`);

  const out = path.join(__dirname, "..", "..", "IMAGE_REGISTRY.md");
  fs.writeFileSync(out, md.join("\n") + "\n");
  console.log(`Assigned ${rows.filter((r) => r.status === "ok").length} rows`);
  console.log(`Missing ${missing.length}`);
  console.log(`Wrote ${out}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
