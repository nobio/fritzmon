const Fritzbox = require('fritznode');
const { Point } = require('@influxdata/influxdb-client')
const { InfluxDB } = require('@influxdata/influxdb-client')

// configure from .env
require('dotenv').config();

// cycle time
const DELAY = process.env.DELAY || 5;

console.log(process.env);

/**
 * connect to fritz box; config see .env
 */
connectFritzBox = async () => {
    return await Fritzbox.fritz();  // options are taken from process.env that are loaded from .env file
}

/**
 * connect to influx database; config see .env
 */
connectInfluxDB = async (data) => {

    // You can generate a Token from the "Tokens Tab" in the UI
    const token = process.env.INFLUXBD_CLOUD_TOKEN;
    const url = process.env.INFLUXBD_CLOUD_HOST

    return new InfluxDB({ url, token });
}

/**
 * write data to influx database
 */
write2InfluxDB = async (client, data) => {
    const org = process.env.INFLUXBD_CLOUD_ORGANIZATION;
    const bucket = process.env.INFLUXBD_CLOUD_BUCKET;

    const writeApi = client.getWriteApi(org, bucket);
    writeApi.useDefaultTags({ bandwith: 'bandwidth' });

    // bandwidth
    writeApi.writePoint(new Point('bndw').intField('upstream_current', data.upCurrent));
    writeApi.writePoint(new Point('bndw').intField('downstream_current', data.downCurrent));
    writeApi.writePoint(new Point('bndw').floatField('upstream_mbit', data.up));
    writeApi.writePoint(new Point('bndw').floatField('downstream_mbit', data.down));

    // max values
    writeApi.writePoint(new Point('max').floatField('downstream_max', data.downMax));
    writeApi.writePoint(new Point('max').floatField('upstream_max', data.upMax));


    writeApi.close()
        .catch(e => {
            console.error(e);
            console.log('Finished ERROR');
        });
}
/**
 * calculate bandwidth from fritz box data
 * 
 * upCurrent:   current upstream in MBit
 * downCurrent: current downstream in MBit
 * factUp:      procentage value of upstream over max upstream
 * factDown:    procentage value of downstream over max downstream
 */
bandwith = async (con) => {
    const usage = await con.getBandwithUsage();
    usage.up = usage.upCurrent / 1024 / 1024;
    usage.down = usage.downCurrent / 1024 / 1024;
    usage.factUp = ((usage.upCurrent) / usage.upMax);
    usage.factDown = ((usage.downCurrent) / usage.downMax);
    return usage;
}

run = async () => {
    let conFritz = await connectFritzBox();
    let conInflux = await connectInfluxDB();

    setInterval(async () => {
        try {
            const usage = await bandwith(conFritz);
            await write2InfluxDB(conInflux, usage);
            console.log(`\n${new Date().toISOString()}`);
            console.log(usage);
        } catch (error) {
            console.error(error);
            conFritz = await connectFritzBox();
            conInflux = await connectInfluxDB();
            console.log(`reconnecting...`);
        }
    }, DELAY * 1000);
};

run();



/*
    let devices = await con.getDeviceList();
    console.log(JSON.stringify(devices, ' ', '  '));

    let overview = await con.getOverview();
    let nas = await con.getNAS();
    console.log(JSON.stringify(nas, ' ', '  '));

    console.log(JSON.stringify(overview, ' ', '  '));
*/
