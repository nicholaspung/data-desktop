export namespace database {
	
	export class FieldDefinition {
	    key: string;
	    type: string;
	    displayName: string;
	    description?: string;
	    unit?: string;
	    isSearchable?: boolean;
	    relatedDataset?: string;
	    relatedField?: string;
	    isRelation?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FieldDefinition(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.type = source["type"];
	        this.displayName = source["displayName"];
	        this.description = source["description"];
	        this.unit = source["unit"];
	        this.isSearchable = source["isSearchable"];
	        this.relatedDataset = source["relatedDataset"];
	        this.relatedField = source["relatedField"];
	        this.isRelation = source["isRelation"];
	    }
	}
	export class Dataset {
	    id: string;
	    name: string;
	    description?: string;
	    type: string;
	    fields: FieldDefinition[];
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    lastModified: any;
	
	    static createFrom(source: any = {}) {
	        return new Dataset(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.type = source["type"];
	        this.fields = this.convertValues(source["fields"], FieldDefinition);
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.lastModified = this.convertValues(source["lastModified"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

