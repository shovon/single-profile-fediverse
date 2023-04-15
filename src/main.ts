import { Server } from "http";
import Koa from "koa";
import KoaRouter from "@koa/router";
import bodyParser from "koa-bodyparser";

const username = "main";

const app = new Koa();
const router = new KoaRouter();

const origin = `${process.env.HTTP_PROTOCOL}://${process.env.HOST}`;

router.get("/.well-known/webfinger", (ctx) => {
	console.log(`WebFinger lookup ${ctx.request.query["resource"]}`);

	const resource = ctx.request.query["resource"];
	if (!resource) {
		ctx.status = 400;
		return;
	}

	if (typeof resource !== "string") {
		ctx.status = 400;
		return;
	}

	const [, address] = resource.split(":");
	if (!address) {
		ctx.status = 400;
		return;
	}

	const [uname, host] = address.split("@");
	if (!uname || !host) {
		ctx.status = 400;
		return;
	}

	if (host !== process.env.HOST) {
		ctx.status = 404;
		return;
	}

	if (uname !== "main" && uname !== "admin") {
		ctx.status = 404;
		return;
	}

	if (ctx.request.query["resource"] !== `acct:${uname}@${process.env.HOST}`) {
		ctx.status = 404;
		return;
	}
	console.log("WebFinger found");

	ctx.headers["content-type"] = "application/jrd+json; charset=utf-8";

	ctx.body = {
		subject: `acct:admin@${process.env.HOST}`,
		aliases: [`${origin}/@${uname}}`],
		links: [
			{
				rel: "http://webfinger.net/rel/profile-page",
				type: "text/html",
				href: `${origin}/@${uname}`,
			},
			{
				rel: "self",
				type: "application/activity+json",
				href: `${origin}/users/${uname}`,
			},
			{
				rel: "http://ostatus.org/schema/1.0/subscribe",
				template: `${origin}/authorize_interaction?uri={uri}`,
			},
		],
	};
});

router.get(`/@:username`, (ctx) => {
	if (ctx.params.username !== username && ctx.params.username !== "admin") {
		ctx.status = 404;
		return;
	}
	// TODO: this should be moved to an entirely different front-end or JAM Stack
	//   solution.
	ctx.headers["content-type"] = "text/html; charset=utf-8";
	ctx.body = `
		<!DOCTYPE html>
		<html>
			<head>
				<title>${ctx.params.username}</title>
			</head>
			<body>
				<h1>${ctx.params.username}</h1>
			</body>
		</html>
	`;
});

router.get(`/users/:username`, (ctx) => {
	if (ctx.params.username !== username && ctx.params.username !== "admin") {
		ctx.status = 404;
		return;
	}
	console.log("ActivityPub user lookup");
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		"@context": [
			"https://www.w3.org/ns/activitystreams",
			{
				toot: "http://joinmastodon.org/ns#",
				discoverable: "toot:discoverable",
			},
		],
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${ctx.params.username}`,
		type: "Person",
		preferredUsername: ctx.params.username,
		name: "Sal Rahman",
		inbox: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${ctx.params.username}/inbox`,
		followers: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${ctx.params.username}/followers`,
		following: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${ctx.params.username}/following`,
		outbox: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${ctx.params.username}/outbox`,
		liked: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${ctx.params.username}/liked`,
	};
});

router.get(`/users/:username/followers`, (ctx) => {
	if (ctx.params.username !== username && ctx.params.username !== "admin") {
		ctx.status = 404;
		return;
	}
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${ctx.params.username}/followers`,
		type: "OrderedCollection",
		totalItems: 0,
	};
});

router.get(`/users/:username/following`, (ctx) => {
	if (ctx.params.username !== username && ctx.params.username !== "admin") {
		ctx.status = 404;
		return;
	}
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${ctx.params.username}/following`,
		type: "OrderedCollection",
		totalItems: 0,
	};
});

router.get(`/users/:username/outbox`, (ctx) => {
	if (ctx.params.username !== username && ctx.params.username !== "admin") {
		ctx.status = 404;
		return;
	}
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${ctx.params.username}/outbox`,
		type: "OrderedCollection",
		totalItems: 0,
	};
});

router.get(`/users/:username/liked`, (ctx) => {
	if (ctx.params.username !== username && ctx.params.username !== "admin") {
		ctx.status = 404;
		return;
	}
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${ctx.params.username}/liked`,
		type: "OrderedCollection",
		totalItems: 0,
	};
});

router.post(`/users/:username/inbox`, bodyParser(), (ctx) => {
	if (ctx.params.username !== username && ctx.params.username !== "admin") {
		ctx.status = 404;
		return;
	}
	switch ((ctx.request.body as any).type) {
		case "Follow":
			ctx.status = 200;
			break;
		default:
			ctx.status = 400;
	}
});

router.get(`/users/:username/liked`, (ctx) => {
	if (ctx.params.username !== username && ctx.params.username !== "admin") {
		ctx.status = 404;
		return;
	}
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${ctx.params.username}/liked`,
		type: "OrderedCollection",
		totalItems: 0,
	};
});

app.use(async (ctx, next) => {
	console.log(ctx.request.URL.toString());
	await next();
});
app.use(router.routes());

app.listen(process.env.PORT, function (this: Server) {
	console.log(this.address());
});
