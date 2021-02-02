import * as dotenv from "dotenv";
dotenv.config();

import path from "path";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import typeDefs from "./schema";
import resolvers from "./resolvers";
import * as moviedb from "./services/moviedb";
import * as userdb from "./services/userdb";
import * as routes from "./routes";

const apiUrl = process.env.API_URL as string;
const apiKey = process.env.API_KEY as string;
const databaseFilename = path.resolve(process.env.DATABASE as string);

const app = express();
app.locals.userService = new userdb.UserService(databaseFilename);

app.use(cors());
app.use(cookieParser());
app.use(routes.userRouter);

// To set cookies for GraphQL playground, open the settings in the GraphQL editor and
// set "request.credentials" to "same-origin"
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        // This is really simple authorization...
        return {
            isAuthorised: async () => await routes.isAuthorised(req),
            userId: req.cookies["userid"],
            services: {
                movieService: new moviedb.MovieService(apiUrl, apiKey),
                discoverService: new moviedb.DiscoverService(apiUrl, apiKey),
                personService: new moviedb.PersonService(apiUrl, apiKey),
                userRatingService: new userdb.UserRatingService(databaseFilename),
            },
        };
    },
});
server.applyMiddleware({ app });

const serverPort = typeof process.env.PORT === "string" ? parseInt(process.env.PORT) : 4001;
app.listen(serverPort, () => console.log(`Application is running on port ${serverPort}.`));

console.log("API URL: ", process.env.API_URL);
