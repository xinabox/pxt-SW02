/**
 * XinaBox SW02 extension for makecode
 * Based on BME680 C libary from Bosch Sensortec.
 *   https://github.com/BoschSensortec/BME680_driver
 */

/**
* SW02 block
*/
//% color=#444444 icon="\uf0ac"
//% groups=['On start', 'Variables', 'Optional']
namespace SW02 {
    export enum Temperature {
        //% block="ºC"
        Celcius = 0,
        //% block="ºF"
        Fahrenheit = 1
    }

    export enum Pressure {
        //% block="hPa"
        HectoPascal = 0,
        //% block="mbar"
        MilliBar = 1
    }

    export enum Humidity {
        //% block="%RH"
        RelativeHumidity = 0
    }

    export enum Length {
        //% block="meter"
        Meter = 0,
        //% block="feet"
        Feet = 1
    }
    let BME680_I2C_ADDR = 0x76

    // const BME680_REG_STATUS = 0x73
    // const BME680_REG_RESET = 0xE0
    // const BME680_REG_ID = 0xD0
    // const BME680_REG_CONFIG = 0x75

    // const BME680_REG_CNTL_MEAS = 0x74
    // const BME680_REG_CNTL_HUM = 0x72
    // const BME680_REG_CNTL_GAS_1 = 0x71
    // const BME680_REG_CNTL_GAS_0 = 0x70

    // const BME680_REG_GAS_WAIT0 = 0x64
    // const BME680_REG_RES_HEAT0 = 0x5A
    // const BME680_REG_IDAC_HEAT0 = 0x50

    // const BME680_REG_GAS_R_LSB = 0x2B
    // const BME680_REG_GAS_R_MSB = 0x2A
    // const BME680_REG_HUM_LSB = 0x26
    // const BME680_REG_HUM_MSB = 0x25
    // const BME680_REG_TEMP_XLSB = 0x24
    // const BME680_REG_TEMP_LSB = 0x23
    // const BME680_REG_TEMP_MSB = 0x22
    // const BME680_REG_PRES_XLSB = 0x21
    // const BME680_REG_PRES_XMSB = 0x20
    // const BME680_REG_PRES_MSB = 0x1F
    // const BME680_REG_FIELD0_ADDR = 0x1D

    // const BME680_REG_CALIB_DATA_1 = 0x89
    // const BME680_REG_CALIB_DATA_2 = 0xE1

    let par_t1 = 0;
    let par_t2 = 0;
    let par_t3 = 0;

    let par_p1 = 0;
    let par_p2 = 0;
    let par_p3 = 0;
    let par_p4 = 0;
    let par_p5 = 0;
    let par_p6 = 0;
    let par_p7 = 0;
    let par_p8 = 0;
    let par_p9 = 0;
    let par_p10 = 0;

    let par_h1 = 0;
    let par_h2 = 0;
    let par_h3 = 0;
    let par_h4 = 0;
    let par_h5 = 0;
    let par_h6 = 0;
    let par_h7 = 0;

    let par_gh1 = 0;
    let par_gh2 = 0;
    let par_gh3 = 0;

    let res_heat_range = 0x00;
    let res_heat_val = 0x00;
    let range_sw_err = 0x00;

    let os_hum = 0x00;
    let os_temp = 0x00;
    let os_pres = 0x00;
    let filter = 0x00;

    let heatr_dur = 0x0000;
    let heatr_temp = 0x0000;
    let nb_conv = 0x00;
    let run_gas = 0x00;
    let heatr_ctrl = 0x00;

    let mode = 0;

    let tempcal = 0;
    let temperature_ = 0;
    let humidity_ = 0;
    let pressure_ = 0;
    let altitude_ = 0;
    let dewpoint_ = 0;
    let gas = 0;
    let gas_res = 0.0;
    let t_fine = 0;


    let _err_measure = 2;
    let _err_estimate = 2;
    let _q = 0.01;
    let _current_estimate = 0.0;
    let _last_estimate = 0.0;
    let _kalman_gain = 0.0;

    let aF = 0;
    let bme680VocValid = false;
    let bDelay = 0;
    let bme680_baseC = 0;
    let bme680_baseH = 0;
    let resFiltered;
    let tVoc = 0;

    let t_offset = -.5;                 // offset temperature sensor
    let h_offset = 1.5;                 // offset humitidy sensor  
    let vocBaseR = 0;                   // base value for VOC resistance clean air, abc 
    let vocBaseC = 0;                   // base value for VOC resistance clean air, abc  
    let vocHum = 0.0;                   // reserved, abc
    let signature = 0x49415143;

    let voc = 0;
    let vocEst = 0.0;
    let isValidIAQ = false;

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(BME680_I2C_ADDR, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.Int16LE);
    }

    function readBlock(reg: number, count: number): number[] {
        let buf: Buffer = pins.createBuffer(count);
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        buf = pins.i2cReadBuffer(BME680_I2C_ADDR, count);

        let tempbuf: number[] = [];
        for (let i: number = 0; i < count; i++) {
            tempbuf[i] = buf[i];
        }
        return tempbuf;
    }

    function init_BME680() {

        let calib_data1: number[] = [];
        let calib_data2: number[] = [];
        let calib_data: number[] = [];

        calib_data1 = readBlock(0x89, 25);
        calib_data2 = readBlock(0xE1, 16);
        calib_data = calib_data.concat(calib_data1);
        calib_data = calib_data.concat(calib_data2);

        par_t1 = (calib_data[34] << 8) | calib_data[33];
        par_t2 = pos2neg((calib_data[2] << 8) | calib_data[1]);
        par_t3 = pos2neg((calib_data[3]));

        par_p1 = (calib_data[6] << 8) | calib_data[5];
        par_p2 = pos2neg((calib_data[8] << 8) | calib_data[7]);
        par_p3 = pos2neg((calib_data[9]));
        par_p4 = pos2neg((calib_data[12] << 8) | calib_data[11]);
        par_p5 = pos2neg((calib_data[14] << 8) | calib_data[13]);
        par_p6 = pos2neg((calib_data[16]));
        par_p7 = pos2neg((calib_data[15]));
        par_p8 = pos2neg((calib_data[20] << 8) | calib_data[19]);
        par_p9 = pos2neg((calib_data[22] << 8) | calib_data[21]);
        par_p10 = (calib_data[23]);

        par_h1 = (calib_data[27] << 4) | (calib_data[26] & 0x0F);
        par_h2 = (calib_data[25] << 4) | (calib_data[26] >> 4);
        par_h3 = pos2neg(calib_data[28]);
        par_h4 = pos2neg(calib_data[29]);
        par_h5 = pos2neg(calib_data[30]);
        par_h6 = calib_data[31];
        par_h7 = calib_data[32];

        par_gh1 = pos2neg(calib_data[37]);
        par_gh2 = pos2neg((calib_data[36] << 8) | calib_data[35]);
        par_gh3 = pos2neg(calib_data[38]);

        res_heat_range = calib_data[39];
        res_heat_val = calib_data[40];
        range_sw_err = calib_data[41];

        os_hum = 0x01;
        os_temp = 0x40;
        os_pres = 0x14;
        filter = 0x00;

        heatr_dur = 0x0059;
        heatr_temp = 0x0000;
        nb_conv = 0x00;
        run_gas = 0x00;
        heatr_ctrl = 0x00;

        mode = 0x01;
    }
    function updateEstimate(mea: number): number {
        _kalman_gain = _err_estimate / (_err_estimate + _err_measure);
        _current_estimate = _last_estimate + _kalman_gain * (mea - _last_estimate);
        _err_estimate = (1.0 - _kalman_gain) * _err_estimate + Math.abs(_last_estimate - _current_estimate) * _q;
        _last_estimate = _current_estimate;
        return _current_estimate;
    }

    function setMeasurementError(mea_e: number): void {
        _err_measure = mea_e;
    }

    function setEstimateError(est_e: number): void {
        _err_estimate = est_e;
    }

    function setProcessNoise(q: number): void {
        _q = q;
    }

    function getKalmanGain(): number {
        return _kalman_gain;
    }

    function getEstimateError(): number {
        return _err_estimate;
    }

    function setGasHeater(set_point: number): number {
        let res_heat_x = 0;
        let var1 = 0.0, var2 = 0.0, var3 = 0.0, var4 = 0.0, var5 = 0.0;
        let par_g1 = getreg(0xED);
        let par_g2 = (getreg(0xEC) << 8) | getreg(0xEB);
        let par_g3 = getreg(0xEE);
        let res_heat_range_ = (getreg(0x02) & 0x30) >> 4;
        let res_heat_val_ = getreg(0x00);
        var1 = (par_g1 / 16.0) + 49.0;
        var2 = ((par_g2 / 32768.0) * 0.0005) + 0.00235;
        var3 = par_g3 / 1024.0;
        var4 = var1 * (1.0 + (var2 * set_point));
        var5 = var4 + (var3 * 25.0); // use 25 C as ambient temperature
        res_heat_x = (3.4 * ((var5 * (4.0 / (4.0 + res_heat_range_)) * (1.0 / (1.0 + (res_heat_val_ * 0.002)))) - 25));
        return res_heat_x;
    }

    function readVOC(): boolean {

        let t = 0.0;
        let h = 0.0;
        let r = 0.0;
        t = temperature(Temperature.Celcius);
        h = humidity(Humidity.RelativeHumidity);
        let a = absHum(t, h);
        aF = (aF == 0 || a < aF) ? a : aF + 0.2 * (a - aF);
        voc = 0.0;
        vocEst = 0.0;
        r = getGasRes();
        let base = bme680Abc(r, a);
        resFiltered = r;        // preload low pass filter
        bme680VocValid = true;
        isValidIAQ = true;
        resFiltered += 0.1 * (r - resFiltered);
        let ratio = base / (r * aF * 7.0);
        let tV = (1250 * Math.log(ratio)) + 125;                     // approximation    
        let tV2 = tVoc + 0.1 * (tV - tVoc);
        tVoc = tVoc == 0 ? tV : tV2;       // global tVoc
        voc = tVoc;
        // let tvoc_estimated_value = 0.0;
        // if (tVoc > 0) {
        //     tvoc_estimated_value = updateEstimate(tVoc);
        // } else {
        //     tvoc_estimated_value = 0;
        // }
        // vocEst = tvoc_estimated_value;
        return true;
    }

//     //% block="SW02 TVOC"
//     //% group="Optional"
//     //% weight=76 blockGap=8
//     export function TVOC(): number {
//         poll();
//         return voc * 1000.0;
//     }

    function getTVOCFiltered(): number {
        return vocEst * 1000.0;
    }

    function bme680Abc(r: number, a: number) {
        //--- automatic baseline correction
        let b = r * a * 7.0;
        if (b > bme680_baseC && bDelay > 5) {
            //--- ensure that new baseC is stable for at least >5*10sec (clean air)
            bme680_baseC = b;
            bme680_baseH = a;
        } else if (b > bme680_baseC) {
            bDelay++;
            //return b;
        } else {
            bDelay = 0;
        }

        return (vocBaseC > bme680_baseC) ? vocBaseC : bme680_baseC;
    }

    function absHum(temp: number, hum: number): number {
        let sdd, dd = 0.0;
        sdd = 6.1078 * Math.pow(10, (7.5 * temp) / (237.3 + temp));
        dd = hum / 100.0 * sdd;
        return 216.687 * dd / (273.15 + temp);
    }
    /********************************************************
            Read Gas Resistance from BME680 Sensor in Ohms  
    *********************************************************/
    //% block="SW02 gas resistance"
    //% group="Optional"
    //% weight=76 blockGap=8
    export function getGasRes(): number {
        poll();
        return Math.round(gas_res);
    }
    function setHumidityOversampling() {
        setreg(0x72, os_hum);
    }

    function setTemperatureOversampling() {
        let var_;
        var_ = getreg(0x74);

        var_ |= os_temp;
        setreg(0x74, var_);
    }

    function setPressureOversampling() {
        let var_;
        var_ = getreg(0x74);

        var_ |= os_pres;
        setreg(0x74, var_);
    }

    function setIIRFilterSize() {
        let var_;
        var_ = getreg(0x75);

        var_ |= filter;
        setreg(0x75, var_);
    }

    function initGasSensor(resHeat: number) {
        // Configure the BME680 Gas Sensor
        setreg(0x71, 0x10);
        // Set gas sampling wait time and target heater resistance
        setreg((0x64), 1 | 0x59);
        setreg((0x5A), resHeat);
    }

    // function setGasHeater(set_point: number): number {
    //     let res_heat_x = 0;
    //     let var1 = 0.0, var2 = 0.0, var3 = 0.0, var4 = 0.0, var5 = 0.0;
    //     let par_g1 = (getreg(0xEC) << 8) | getreg(0xEB);
    //     let par_g2 = getreg(0xED);
    //     let par_g3 = getreg(0xEE);
    //     let res_heat_range_ = (getreg(0x02) & 0x30) >> 4;
    //     let res_heat_val_ = getreg(0x00);
    //     var1 = (par_g1 / 16.0) + 49.0;
    //     var2 = ((par_g2 / 32768.0) * 0.0005) + 0.00235;
    //     var3 = par_g3 / 1024.0;
    //     var4 = var1 * (1.0 + (var2 * set_point));
    //     var5 = var4 + (var3 * 25.0); // use 25 C as ambient temperature_
    //     res_heat_x = (((var5 * (4.0 / (4.0 * res_heat_range_))) - 25.0) * 3.4 / ((res_heat_val_ * 0.002) + 1));
    //     return res_heat_x;
    // }

    function triggerForced() {
        let var_ = 0;
        var_ |= os_temp;
        var_ |= os_pres;
        var_ |= mode;
        setreg(0x74, var_);
    }

    function poll() {
        let status = getreg(0x1D);

        if (status & 0x80) {
            triggerForced();

            let rawData: number[] = [];
            rawData = readBlock(0x1F, 3);
            readPressure(((rawData[0] << 16 | rawData[1] << 8 | rawData[2]) >> 4));

            rawData = readBlock(0x22, 3);
            readTemperature(((rawData[0] << 16 | rawData[1] << 8 | rawData[2]) >> 4));

            rawData = readBlock(0x25, 2);
            readHumidity(((rawData[0] << 8) | rawData[1]));

            rawData = readBlock(0x2A, 2);
            readGas(((rawData[0] << 2 | (0xC0 & rawData[1]) >> 6)));

            //readVOC();
        }
    }

    function readTemperature(adc_temp: number) {
        let var1 = 0, var2 = 0, var3 = 0, T = 0;
        var1 = (adc_temp >> 3) - (par_t1 << 1);
        var2 = (var1 * par_t2) >> 11;
        var3 = ((((var1 >> 1) * (var1 >> 1)) >> 12) * (par_t3 << 4)) >> 14;
        t_fine = var2 + var3;
        temperature_ = ((t_fine * 5 + 128) >> 8) / 100.0;
    }

    function readPressure(adc_pres: number) {
        let var1 = 0;
        let var2 = 0;
        let var3 = 0;
        let var4 = 0;
        let pressure_comp = 0;

        var1 = ((t_fine) >> 1) - 64000;
        var2 = ((((var1 >> 2) * (var1 >> 2)) >> 11) * par_p6) >> 2;
        var2 = var2 + ((var1 * par_p5) << 1);
        var2 = (var2 >> 2) + (par_p4 << 16);
        var1 = (((((var1 >> 2) * (var1 >> 2)) >> 13) *
            (par_p3 << 5)) >> 3) +
            ((par_p2 * var1) >> 1);
        var1 = var1 >> 18;
        var1 = ((32768 + var1) * par_p1) >> 15;
        pressure_comp = 1048576 - adc_pres;
        pressure_comp = ((pressure_comp - (var2 >> 12)) * (3125));
        var4 = (1 << 31);
        if (pressure_comp >= var4)
            pressure_comp = ((pressure_comp / var1) << 1);
        else
            pressure_comp = ((pressure_comp << 1) / var1);
        var1 = (par_p9 * (((pressure_comp >> 3) * (pressure_comp >> 3)) >> 13)) >> 12;
        var2 = ((pressure_comp >> 2) * par_p8) >> 13;
        var3 = ((pressure_comp >> 8) * (pressure_comp >> 8) * (pressure_comp >> 8) * par_p10) >> 17;

        pressure_comp = (pressure_comp) + ((var1 + var2 + var3 + (par_p7 << 7)) >> 4);

        pressure_ = pressure_comp;
    }

    function readHumidity(adc_hum: number) {
        let var1;
        let var2;
        let var3;
        let var4;
        let var5;
        let var6;
        let temp_scaled;
        let calc_hum;
        temp_scaled = ((t_fine * 5) + 128) >> 8;
        var1 = (adc_hum - (par_h1 << 4)) - (((temp_scaled * par_h3) / (100)) >> 1);
        var2 = (par_h2 * (((temp_scaled * par_h4) / (100)) + (((temp_scaled * ((temp_scaled * par_h5) / (100))) >> 6) / (100)) + (1 << 14))) >> 10;
        var3 = var1 * var2;
        var4 = (((par_h6) << 7) + ((temp_scaled * par_h7) / (100))) >> 4;
        var5 = ((var3 >> 14) * (var3 >> 14)) >> 10;
        var6 = (var4 * var5) >> 1;
        calc_hum = (((var3 + var6) >> 10) * (1000)) >> 12;
        if (calc_hum > 102400) {
            calc_hum = 102400;
        } else if (calc_hum < 0) {
            calc_hum = 0;
        }
        humidity_ = (calc_hum / 1024.0);
    }

    function readGas(resVal: number) {
        let const_array1: number[] = [1, 1, 1, 1, 1, 0.99, 1, 0.992, 1, 1, 0.998, 0.995, 1, 0.99, 1, 1];
        let const_array2: number[] = [
            8000000.0, 4000000.0, 2000000.0, 1000000.0, 499500.4995, 248262.1648, 125000.0,
            63004.03226, 31281.28128, 15625.0, 7812.5, 3906.25, 1953.125, 976.5625, 488.28125, 244.140625];

        let gasRange = getreg(0x2B);
        gasRange &= 0x0F;

        let range_switch_error = getreg(0x04);

        let var1 = 0;
        var1 = (1340.0 + 5.0 * range_switch_error) * const_array1[gasRange];
        gas_res = var1 * const_array2[gasRange] / (resVal - 512.0 + var1);
    }

    //% block="SW02 begin"
    //% group="On start"
    //% weight=76 blockGap=8
    export function begin() {
        reset();
        init_BME680();
        setHumidityOversampling();
        setTemperatureOversampling();
        setPressureOversampling();
        setIIRFilterSize();
        initGasSensor(setGasHeater(250));
        setreg(0x74, mode);
    }

    //% block="SW02 temperature %u"
    //% group="Variables"
    //% weight=76 blockGap=8
    export function temperature(u: Temperature): number {
        poll();
        temperature_ = temperature_ + tempcal;
        temperature_ = fix(temperature_)
        if (u == Temperature.Celcius) return temperature_;
        else return (32 + temperature_ * 9 / 5);
    }

    //% block="SW02 humidity %u"
    //% group="Variables"
    //% weight=76 blockGap=8
    export function humidity(u: Humidity): number {
        poll();
        return fix(humidity_);
    }

    //% block="SW02 pressure %u"
    //% group="Variables"
    //% weight=76 blockGap=8
    export function pressure(u: Pressure): number {
        poll();
        if (u == Pressure.HectoPascal) return fix(pressure_ / 100);
        else return fix(pressure_);
    }

    //% block="SW02 pressure altitude"
    //% group="Variables"
    //% weight=76 blockGap=8
    export function pressureAltitude() {
        poll();
        let atmospheric: number = pressure_ / 100.0;
        altitude_ = 44330.0 * (1.0 - Math.pow((atmospheric / 1013.25), 1 / 5.255));
        return altitude_;
    }

    //% block="SW02 density altitude"
    //% group="Variables"
    //% weight=76 blockGap=8
    export function densityAltitude(sea_level_pressure: number) {
        poll();
        let atmospheric: number = pressure_ / 100.0;
        altitude_ = 44330.0 * (1.0 - Math.pow((atmospheric / (sea_level_pressure / 100.0)), 1 / 5.255));
        return altitude_;
    }

    //% block="SW02 dewpoint %u"
    //% group="Variables"
    //% weight=76 blockGap=8
    export function dewpoint(u: Temperature) {
        poll();
        dewpoint_ = 243.04 * (Math.log(humidity_ / 100.0) + ((17.625 * temperature_) / (243.04 + temperature_)))
            / (17.625 - Math.log(humidity_ / 100.0) - ((17.625 * temperature_) / (243.04 + temperature_)));
        if (u == Temperature.Celcius) return dewpoint_;
        else return (32 + (dewpoint_) * 9 / 5);
    }

    //% block="SW02 reset"
    //% group="Optional"
    //% weight=76 blockGap=8
    export function reset() {
        setreg(0xE0, 0xB6);
        basic.pause(100)
    }

    //% block="SW02 power $on"
    //% group="Optional"
    //% weight=98 blockGap=8
    //% on.shadow="toggleOnOff"
    export function onOff(on: boolean) {
        if (on) setreg(0x74, 0x01);
        else setreg(0x74, 0x00)
    }
    //% block="SW02 address %on"
    //% group="Optional"
    //% weight=50 blockGap=8
    //% on.shadow="toggleOnOff"
    export function address(on: boolean) {
        if (on) BME680_I2C_ADDR = 0x76
        else BME680_I2C_ADDR = 0x77
    }

    function setTempCal(offset: number) {
        tempcal = offset;
    }

    function fix(x: number) {
        return Math.round(x * 100) / 100
    }

    function pos2neg(val: number): number {
        if (val <= 255) {
            if (((val >> 7) & 0x01) == 0x01) {
                val = -(256 - val)
            }
        } else if (val <= 65535 && val >= 255) {
            if (((val >> 15) & 0x01) == 0x01) {
                val = -(65536 - val)
            }
        }
        return val
    }
}
