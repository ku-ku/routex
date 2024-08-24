export enum MapType {
    route,
    point,
    stop,
    version,
    reference
};

export enum Direction {
    unknown = -1,
    forward = 0,
    backward= 1,
    both    = 2,  //for end-stop forward/backward
    nears   = 9
};


export type MapObject = {
    id: string,
    name: string,
    type: MapType,
    code?: string,
    description?: string
};

export type MapRouteVersion = MapObject & {
    regdt: Date
};

export type MapPoint =  MapObject & {
    direction: Direction,   /* forward|backward */
    lat: number,
    lon: number,
    index: number,
    location: any,
    routeID?: null|string,
    locationID?: null|string,
    color: null|string,
    ended: boolean,
    typeID?: string,
    twnID?: null|string,
    radius?:null|number,
    distance?:null|number
};
export type MapRoute = MapObject & {
    num: number,
    direction: Direction,   /* forward|backward */
    start: Date,
    end:   Date|null,
    routeTypeID: string,
    color?: string,
    versions?: MapRouteVersion[],
    version?: MapRouteVersion,
    points?: MapPoint[],
    distance?:null|number
};


