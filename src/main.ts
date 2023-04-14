import { Server } from "http";
import Koa from "koa";
import KoaRouter from "@koa/router";
import bodyParser from "koa-bodyparser";

const username = "main";

const app = new Koa();
const router = new KoaRouter();

const origin = `${process.env.HTTP_PROTOCOL}://${process.env.HOST}`;

router.get("/.well-known/webfinger", (ctx) => {
	console.log(ctx.request.query["resource"]);
	if (
		ctx.request.query["resource"] !== `acct:${username}@${process.env.HOST}`
	) {
		ctx.status = 404;
		return;
	}

	ctx.headers["content-type"] = "application/jrd+json; charset=utf-8";

	ctx.body = {
		subject: `acct:admin@${process.env.HOST}`,
		aliases: [`${origin}/@${username}}`],
		links: [
			{
				rel: "http://webfinger.net/rel/profile-page",
				type: "text/html",
				href: `${origin}/@${username}`,
			},
			{
				rel: "self",
				type: "application/activity+json",
				href: `${origin}/users/${username}`,
			},
			{
				rel: "http://ostatus.org/schema/1.0/subscribe",
				template: `${origin}/authorize_interaction?uri={uri}`,
			},
		],
	};
});

router.get(`@${username}`, (ctx) => {
	// TODO: this should be moved to an entirely different front-end or JAM Stack
	//   solution.
	ctx.headers["content-type"] = "text/html; charset=utf-8";
	ctx.body = `
		<!DOCTYPE html>
		<html>
			<head>
				<title>${username}</title>
			</head>
			<body>
				<h1>${username}</h1>
			</body>
		</html>
	`;
});

router.get(`/users/${username}`, (ctx) => {
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${username}`,
		type: "Person",
		preferredUsername: username,
		name: "Sal Rahman",
		inbox: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${username}/inbox`,
		followers: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${username}/followers`,
		following: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${username}/following`,
		outbox: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${username}/outbox`,
		liked: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${username}/liked`,
	};
});

router.get(`/users/${username}/followers`, (ctx) => {
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${username}/followers`,
		type: "OrderedCollection",
		totalItems: 0,
	};
});

router.get(`/users/${username}/following`, (ctx) => {
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${username}/following`,
		type: "OrderedCollection",
		totalItems: 0,
	};
});

router.get(`/users/${username}/outbox`, (ctx) => {
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${username}/outbox`,
		type: "OrderedCollection",
		totalItems: 0,
	};
});

router.get(`/users/${username}/liked`, (ctx) => {
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${username}/liked`,
		type: "OrderedCollection",
		totalItems: 0,
	};
});

router.post(`/users/${username}/inbox`, bodyParser(), (ctx) => {
	switch ((ctx.request.body as any).type) {
		case "Follow":
			ctx.status = 200;
			break;
		default:
			ctx.status = 400;
	}
});

router.get(`/users/${username}/liked`, (ctx) => {
	ctx.headers["content-type"] = "application/activity+json; charset=utf-8";
	ctx.body = {
		id: `${process.env.HTTP_PROTOCOL}://${process.env.HOST}/users/${username}/liked`,
		type: "OrderedCollection",
		totalItems: 0,
	};
});

app.use(router.routes());

app.listen(process.env.PORT, function (this: Server) {
	console.log(this.address());
});
