export enum MapType {
    route,
    stop,
    version
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
    dt: Date
};

export type MapRoute = MapObject & {
    num: number,
    direction: Direction,   /* forward|backward|nears */
    start: Date,
    end:   Date|null,
    routeTypeID: string,
    versions?: Array<MapRouteVersion>,
    version?: MapRouteVersion,
    points?: Array<any>
};


