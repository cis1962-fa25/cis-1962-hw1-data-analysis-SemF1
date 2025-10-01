/**
 * [TODO] Step 0: Import the dependencies, fs and papaparse
 */
const fs = require('fs');
const Papa = require('papaparse');
/**
 * [TODO] Step 1: Parse the Data
 *      Parse the data contained in a given file into a JavaScript objectusing the modules fs and papaparse.
 *      According to Kaggle, there should be 2514 reviews.
 * @param {string} filename - path to the csv file to be parsed
 * @returns {Object} - The parsed csv file of app reviews from papaparse.
 */
function parseData(filename) {
    const file = fs.readFileSync(filename, 'utf8');
    const parsed = Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
    });
    return parsed.data;
}

/**
 * [TODO] Step 2: Clean the Data
 *      Filter out every data record with null column values, ignore null gender values.
 *
 *      Merge all the user statistics, including user_id, user_age, user_country, and user_gender,
 *          into an object that holds them called "user", while removing the original properties.
 *
 *      Convert review_id, user_id, num_helpful_votes, and user_age to Integer
 *
 *      Convert rating to Float
 *
 *      Convert review_date to Date
 * @param {Object} csv - a parsed csv file of app reviews
 * @returns {Object} - a cleaned csv file with proper data types and removed null values
 */
function cleanData(csv) {
    return csv
        .filter(
            (r) =>
                r.review_id &&
                r.user_id &&
                r.review_text &&
                r.rating &&
                r.review_date &&
                r.verified_purchase &&
                r.device_type &&
                r.num_helpful_votes &&
                r.app_version,
        )
        .map((r) => {
            return {
                review_id: parseInt(r.review_id),
                app_name: r.app_name,
                app_category: r.app_category,
                review_text: r.review_text,
                review_language: r.review_language,
                rating: parseFloat(r.rating),
                review_date: new Date(r.review_date),
                verified_purchase: r.verified_purchase.toLowerCase() === 'true',
                device_type: r.device_type,
                num_helpful_votes: parseInt(r.num_helpful_votes),
                app_version: r.app_version,
                user: {
                    user_id: parseInt(r.user_id),
                    user_age: parseInt(r.user_age),
                    user_country: r.user_country,
                    user_gender: r.user_gender || '',
                },
            };
        });
}

/**
 * [TODO] Step 3: Sentiment Analysis
 *      Write a function, labelSentiment, that takes in a rating as an argument
 *      and outputs 'positive' if rating is greater than 4, 'negative' is rating is below 2,
 *      and 'neutral' if it is between 2 and 4.
 * @param {Object} review - Review object
 * @param {number} review.rating - the numerical rating to evaluate
 * @returns {string} - 'positive' if rating is greater than 4, negative is rating is below 2,
 *                      and neutral if it is between 2 and 4.
 */
function labelSentiment({ rating }) {
    if (rating > 4.0) return 'positive';
    if (rating < 2.0) return 'negative';
    return 'neutral';
}

/**
 * [TODO] Step 3: Sentiment Analysis by App
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each app into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{app_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for an app
 */
function sentimentAnalysisApp(cleaned) {
    const counts = {};

    cleaned.forEach((r) => {
        const sentiment = labelSentiment(r);
        r.sentiment = sentiment;

        if (!counts[r.app_name]) {
            counts[r.app_name] = { positive: 0, neutral: 0, negative: 0 };
        }
        counts[r.app_name][sentiment]++;
    });

    return Object.entries(counts).map(([app_name, stats]) => ({
        app_name,
        ...stats,
    }));
}

/**
 * [TODO] Step 3: Sentiment Analysis by Language
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each language into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{lang_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for a language
 */
function sentimentAnalysisLang(cleaned) {
    const counts = {};

    cleaned.forEach((r) => {
        const sentiment = labelSentiment(r);
        r.sentiment = sentiment;

        if (!counts[r.review_language]) {
            counts[r.review_language] = {
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }
        counts[r.review_language][sentiment]++;
    });

    return Object.entries(counts).map(([lang_name, stats]) => ({
        lang_name,
        ...stats,
    }));
}

/**
 * [TODO] Step 4: Statistical Analysis
 *      Answer the following questions:
 *
 *      What is the most reviewed app in this dataset, and how many reviews does it have?
 *
 *      For the most reviewed app, what is the most commonly used device?
 *
 *      For the most reviewed app, what the average star rating (out of 5.0)?
 *
 *      Add the answers to a returned object, with the format specified below.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{mostReviewedApp: string, mostReviews: number, mostUsedDevice: String, mostDevices: number, avgRating: float}} -
 *          the object containing the answers to the desired summary statistics, in this specific format.
 */
function summaryStatistics(cleaned) {
    const appCounts = {};
    cleaned.forEach((r) => {
        appCounts[r.app_name] = (appCounts[r.app_name] || 0) + 1;
    });
    const mostReviewedApp = Object.keys(appCounts).reduce((a, b) =>
        appCounts[a] > appCounts[b] ? a : b,
    );
    const mostReviews = appCounts[mostReviewedApp];

    const reviews = cleaned.filter((r) => r.app_name === mostReviewedApp);

    const deviceCounts = {};
    reviews.forEach((r) => {
        deviceCounts[r.device_type] = (deviceCounts[r.device_type] || 0) + 1;
    });
    const mostUsedDevice = Object.keys(deviceCounts).reduce((a, b) =>
        deviceCounts[a] > deviceCounts[b] ? a : b,
    );
    const mostDevices = deviceCounts[mostUsedDevice];

    const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return {
        mostReviewedApp,
        mostReviews,
        mostUsedDevice,
        mostDevices,
        avgRating: parseFloat(avgRating.toFixed(2)),
    };
}

/**
 * Do NOT modify this section!
 */
module.exports = {
    parseData,
    cleanData,
    sentimentAnalysisApp,
    sentimentAnalysisLang,
    summaryStatistics,
    labelSentiment,
};
