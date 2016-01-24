OKAY THIS TIME FOR REALS


DataSource is essentially a function that takes a DataRequest and returns a DataResponse

DataRequest:

{
	"page": "",
	"ordering": ""
	"filters": {
		"asd": "dsa"
	}
}

DataResponse:

{
	"count": 0,
	"next": "",      // page id
	"previous": "",  // page id
	"results": []
}

The Lifecycle looks like:

- Component is created
- RTable decodes the URL, sets the initial state, sets the initial DataRequest
- RTable requests the data
- DataSource returns a DataResponse
- RTable updates the state from the DataResponse

- User clicks Next Page
- RTable updates the DataRequest with blah blah
- you lknow the rest

- a filter value has changed!
- update DataRequest with the stuff
- stuff stuff
