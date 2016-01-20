Custom data sources
-------------------

how to best implement?

DataLoader currently:

- a filter value was changed!
- get last data url
- update data url with new filters
- reload new data url
- save this data url

DataLoader perhaps:

- a filter value was changed!
- get last set of params
- build new set of params
- build new data url
- reload new data url
- save that set of params

### BUT WHAT IF WE ARE USING DIFFERENT PAGINATION

There could be 'offset' pagination, where the 'next' url determines where to go.

There could be 'cursor' pagination, where the 'next' url also determines where to go.

In any case:

- we may or may not have the total count of elements
- we'll probably not be able to implement "go to beginning / end" that comes in natural in page-based navigation

So I have an API that has cursor-based pagination. How could it work in general?

- an initial request is fired, it returns next/previous urls
- the component is rendered,
- 'next' button gets clicked, another request is fired for the 'next' url

Feelswrong.jpg

### How to abstract away the fact that data URLs even exist?

(while still keeping the DataSource stateless! all state must live in RTable)

- "Render the RTable with this DataSource"
- RTable decodes SourceParams from window url, instantiates the DataSource, passes the ability to setState
- DataSource builds the URL from its own url and SourceParams, fires the initial request
- The request completes, DataSource builds a DataSnapshot and triggers setState, component gets re-rendered
- DataSnapshot defines that the "next" action contains some particular SourceParamsChange
- User clicks "next"
- RTable uses the SourceParamsChange to build new SourceParams, fires a new request

Two options here:

A) The format of SourceParams needs to be defined by RTable, so that it's sufficient to render the UI (pagination, filters, ordering)
B) SourceParams are opaque to RTable, but DataSnapshot contains the information how to render the UI

Bigger example:

- User visits /items/?page=20&foo=5
- RTable defines SourceParams {page: "20", foo: "5"} - just get all, we'll get to prefixing later
- DataSource translates these params and does "GET /items-api/?page=20&foo=5" - or something different, but probably a plain pass-through makes the most sense
- DataSource produces DataSnapshot that should explain all.

Example DataSnapshot:

	results: [],
	pagination: { // scheme as understood by RTable
		page: 5,
		pages: 10,
		// ... all kinds of stuff we are able to calculate and render
		next: {  // SourceParamsChange
			"page": 21
		},
		"previous": {  // SourceParamsChange
			"page": 19
		}
	},
	ordering: [],
	filters: {
		key: value
	},

`?` Would be useful to make the DataSource inherently able to provide initial empty DataSnapshot with results and pagination missing, but ordering and filters prefilled.

`?` RTable needs to know beforehand what filters are there

`!` RTable needs to know something about SourceParams to be able to decode the initial values from the window URL properly.
However, pagination can look in a different way so it doses not make sense to always decode "page"...

`?` This feels rather inconsistent - pagination is handled via SourceParamsChanges but filtering is just as well handled directly? Nope, we can do better than that
